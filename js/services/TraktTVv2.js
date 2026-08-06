/**
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: https://docs.trakt.tv/docs/getting-started
 */
const TRAKT_CLIENT_ID = 'e65088ee83478f54ffd9d5775dc63d0c64312eabd72b6b2e5623194675959bac'
const TRAKT_CLIENT_SECRET = '3e97816f32ac913e51a96d2b0296b8f2172e7dee4b01e62df381ad7f62560c96'
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

DuckieTV.factory('TraktTVv2', ['$q', '$http', 'SceneNameResolver',
  function($q, $http, SceneNameResolver) {
    var activeSearchRequest = false
    var activeTrendingRequest = false
    var dtv_refresh = new Date().toISOString().substring(0, 10)

    var endpoint = 'https://api.trakt.tv/'
    var endpoints = {
      people: 'shows/%s/people?dtv_refresh=' + dtv_refresh,
      serie: 'shows/%s?extended=full&dtv_refresh=' + dtv_refresh,
      serie2: 'shows/%s&dtv_refresh=' + dtv_refresh,
      seasons: 'shows/%s/seasons?extended=full&dtv_refresh=' + dtv_refresh,
      episodes: 'shows/%s/seasons/%s/episodes?extended=full&dtv_refresh=' + dtv_refresh,
      search: 'search/show?extended=full&limit=100&fields=title,aliases&query=%s&dtv_refresh=' + dtv_refresh,
      trending: 'shows/trending?extended=full&limit=500&dtv_refresh=' + dtv_refresh,
      tvdb_id: 'search/tvdb/%s?type=show&dtv_refresh=' + dtv_refresh,
      trakt_id: 'search/trakt/%s?type=show&dtv_refresh=' + dtv_refresh,
      config: 'users/settings',
      watched: 'sync/watched/shows?limit=10000',
      episodeSeen: 'sync/history',
      episodeUnseen: 'sync/history/remove',
      userShows: 'sync/collection/shows?limit=10000',
      addCollection: 'sync/collection',
      removeCollection: 'sync/collection/remove'
    }
    var oauthendpoint = 'https://auth.trakt.tv/'
    var oauthendpoints = {
      devicecode: 'oauth/device/code',
      devicetoken: 'oauth/device/token',
      token: 'oauth/token'
    }

    var parsers = {
      trakt: function(show) {
        Object.keys(show.ids).map(function(key) {
          show[key + '_id'] = show.ids[key]
        })
        if ('title' in show) {
          show.name = show.title
        }
        // fill in the tvdb_id if it is missing from  the Trakt.tv API and we have it in our Xref table
        show.tvdb_id = ('tvdb_id' in show && show.tvdb_id !== null && show.tvdb_id !== 0) ? show.tvdb_id : SceneNameResolver.getTvdbidFromTraktid(show.trakt_id)
        return show
      },
      people: function(result) {
        return result.data
      },
      seasons: function(result) {
        return result.data.map(function(season) {
          return parsers.trakt(season)
        })
      },
      search: function(result) {
        return result.data.map(function(show) {
          return parsers.trakt(show.show)
        })
      },
      trending: function(result) {
        return result.data.map(function(show) {
          return parsers.trakt(show.show)
        })
      },
      episodes: function(result) {
        var map = []

        var episodes = []

        result.data.map(function(episode) {
          if (map.indexOf(episode.number) > -1 || episode.number === 0) return
          episodes.push(parsers.trakt(episode))
          map.push(episode.number)
        })
        return episodes
      },
      /**
       * Trakt returns a list of search results here. We want only the first object that has a serie detail object in it.
       * @param  trakt result data
       * @return serie parsed serie
       */
      serie: function(result) {
        return parsers.trakt(result.data)
      },
      serie2: function(result) {
        return parsers.trakt(result.data)
      },
      tvdb_id: function(result) {
        // this prevents choking on series custom settings during import of backup
        var results = result.data.filter(function(record) {
          return record.type == 'show'
        })
        if (results.length > 0) {
          return parsers.trakt(results[0].show)
        } else {
          throw 'No results for search by tvdb_id'
        }
      },
      trakt_id: function(result) {
        // this prevents choking on series custom settings during import of backup
        var results = result.data.filter(function(record) {
          return record.type == 'show'
        })
        if (results.length > 0) {
          return parsers.trakt(results[0].show)
        } else {
          throw 'No results for search by trakt_id'
        }
      },
      watched: function(result) {
        return result.data.map(function(show) {
          out = parsers.trakt(show.show)
          out.seasons = show.seasons
          return out
        })
      },
      userShows: function(result) {
        return result.data.map(function(show) {
          out = parsers.trakt(show.show)
          out.seasons = show.seasons
          return out
        })
      }
    }

    function delay(ms) {
      return new Promise(function(resolve) {
        setTimeout(resolve, ms)
      })
    }

    // trakt api GET methods that require authorisation
    var authorized = [
      'watched', 'userShows', 'config'
    ]

    /**
     * Get one of the urls from the endpoint and replace the parameters in it when provided.
     */
    var getUrl = function(type, param, param2) {
      var out = endpoint + endpoints[type].replace('%s', encodeURIComponent(param))
      return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out
    }
    /**
     * Get one of the urls from the oauthendpoint and replace the parameters in it when provided.
     */
    var getOauthUrl = function(type, param, param2) {
      var out = oauthendpoint + oauthendpoints[type].replace('%s', encodeURIComponent(param))
      return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out
    }

    /**
     * If a customized parser is available for the data, run it through that.
     */
    var getParser = function(type) {
      return type in parsers ? parsers[type] : function(data) {
        return data.data
      }
    }

    /**
     * Generic error-catching and re-throwing
     */
    var rethrow = function(err) {
      throw err
    }

    /**
     * Promise requests with batchmode toggle to auto-kill a previous request when running.
     * The activeRequest and batchMode toggles make sure that find-as-you-type can execute multiple
     * queries in rapid succession by aborting the previous one. Can be turned off at will by using enableBatchMode()
     */
    var promiseRequest = function(type, param, param2, promise) {
      var url = getUrl(type, param, param2)
      var parser = getParser(type)
      var headers = {
        'trakt-api-key': TRAKT_CLIENT_ID,
        'trakt-api-version': 2,
        'Content-Type': 'application/json'
      }
      if (authorized.indexOf(type) > -1) {
        headers.Authorization = 'Bearer ' + localStorage.getItem('trakttv.token')
      }
      return $http.get(url, {
        timeout: promise || 120000,
        headers: headers,
        cache: false
      }).then(function(result) {
        return parser(result)
      }, function(err) {
        if (err.status == 401) {
          // token auth expired, renew
          service.renewToken()
          // restart request and return original promise
          return promiseRequest(type, param, param2, promise)
        }
        if (err.status == 420) {
          // limit exceeded
          console.error('Trakt 420: Limit exceeded, see https://github.com/SchizoDuckie/DuckieTV/issues/1447 for more details.')
          return
        }
        if (err.status == 423) {
          // trakt user account locked
          console.error('Trakt 423: Trakt user account locked, email support@trakt.tv so they can fix your account.')
          return
        }
        if (err.status == 429) {
          // rate limited, look at headers to see when we should try again otherwise just wait for a few seconds
          var headers = err && err.headers ? err.headers() : {}
          var retryAfterSeconds = +headers['retry-after']
          retryAfterSeconds  = retryAfterSeconds ? retryAfterSeconds : 3
          console.error('Trakt rate limited! trying again in %s seconds', retryAfterSeconds)

          return delay(retryAfterSeconds * 1000).then(function() {
            return promiseRequest(type, param, param2, promise)
          })
        }
        if (err.status == 502) {
          // cloudflare bad gateway, look at headers to see when we should try again otherwise just wait for a few seconds
          var headers = err && err.headers ? err.headers() : {}
          var retryAfterSeconds = +headers['retry-after']
          retryAfterSeconds  = retryAfterSeconds ? retryAfterSeconds : 3
          console.error('cloudflare bad gateway, trying again in %s seconds', retryAfterSeconds)

          return delay(retryAfterSeconds * 1000).then(function() {
            return promiseRequest(type, param, param2, promise)
          })
        }
        if (err.status == 504) {
          // cloudflare gateway timeout, look at headers to see when we should try again otherwise just wait for a few seconds
          var headers = err && err.headers ? err.headers() : {}
          var retryAfterSeconds = +headers['retry-after']
          retryAfterSeconds  = retryAfterSeconds ? retryAfterSeconds : 3
          console.error('cloudflare gateway timeout, trying again in %s seconds', retryAfterSeconds)

          return delay(retryAfterSeconds * 1000).then(function() {
            return promiseRequest(type, param, param2, promise)
          })
        }
        if (err.status !== 0) { // only if this is not a cancelled request, rethrow
          //console.error('Trakt tv error!', err)
          throw 'Error ' + err.status + ':' + err.statusText
        }
      })
    }

    var performPost = function(type, param) {
      var url = getUrl(type)
      var headers = {
        'trakt-api-key': TRAKT_CLIENT_ID,
        'trakt-api-version': 2,
        'Authorization': 'Bearer ' + localStorage.getItem('trakttv.token'),
        'Content-Type': 'application/json'
      }
      return $http.post(url, param, {
        headers: headers
      }).then(function(result) {
        return result
      }, function(err) {
        if (err.status == 401) {
          // token auth expired, renew
          service.renewToken()
          // restart request and return original promise
          return performPost(type, param)
        }
        if (err.status == 420) {
          // limit exceeded
          console.error('Trakt 420: Limit exceeded, see https://github.com/SchizoDuckie/DuckieTV/issues/1447 for more details.')
          return
        }
        if (err.status == 423) {
          // trakt user account locked
          console.error('Trakt 423: Trakt user account locked, email support@trakt.tv so they can fix your account.')
          return
        }
        if (err.status == 429) {
          // rate limited
          var headers = err && err.headers ? err.headers() : {}
          var retryAfterSeconds = +headers['retry-after']
          retryAfterSeconds  = retryAfterSeconds ? retryAfterSeconds : 3
          console.error('Trakt rate limited! trying again in %s seconds', retryAfterSeconds)
          return delay(retryAfterSeconds * 1000).then(function() {
            return performPost(type, param)
          })
        }
        if (err.status !== 0) { // only if this is not a cancelled request, rethrow
          //console.error('Trakt tv error!', err)
          throw 'Error ' + err.status + ':' + err.statusText
        }
      })
    }

    var service = {
      /**
       * get a single show summary.
       * id can be Trakt.tv ID, Trakt.tv slug, or IMDB ID
       * https://docs.trakt.tv/reference/getshowssummary
       */
      serie: async function(id, existingSerie, seriesOnly) {
        try {
          var serie = existingSerie || await promiseRequest('serie', id)
          if (seriesOnly) {
            return serie
          }

          await Promise.all([
            service.people(serie.trakt_id),
            service.seasons(serie.trakt_id)
          ]).then(function([people, seasons]) {
            serie.people = people
            serie.seasons = seasons
          })

          await Promise.all(serie.seasons.map(async function(season) {
            season.episodes = await service.episodes(serie.trakt_id, season.number)
            return season
          }))

          return serie
        } catch (err) {
          rethrow(err)
        }
      },
      serie2: async function(id) {
        try {
          var serie = await promiseRequest('serie2', id)
          return serie
        } catch (err) {
            rethrow(err)
        }
      },
      /**
       * get all seasons for a show.
       * id can be Trakt.tv ID, Trakt.tv slug, or IMDB ID
       * https://docs.trakt.tv/reference/getshowsseasons
       */
      seasons: function(id) {
        return promiseRequest('seasons', id)
      },
      /**
       * get all episodes for a show.
       * id can be Trakt.tv ID, Trakt.tv slug, or IMDB ID
       * season is a number
       * https://docs.trakt.tv/reference/getshowsepisodesummary
       */
      episodes: function(id, seasonNumber) {
        return promiseRequest('episodes', id, seasonNumber)
      },
      /**
       * get all actors in a show.
       * id can be Trakt.tv ID, Trakt.tv slug, or IMDB ID
       * https://docs.trakt.tv/reference/getshowspeople
       */
      people: function(id) {
        return promiseRequest('people', id)
      },
      search: function(what) {
        service.cancelTrending()
        service.cancelSearch()
        activeSearchRequest = $q.defer()
        return promiseRequest('search', what, null, activeSearchRequest.promise).then(function(results) {
          activeSearchRequest = false
          return results
        })
      },
      cancelSearch: function() {
        if (activeSearchRequest && activeSearchRequest.resolve) {
          activeSearchRequest.reject('search abort')
          activeSearchRequest = false
        }
      },
      hasActiveSearchRequest: function() {
        return (activeSearchRequest && activeSearchRequest.resolve)
      },
      trending: function(noCache) {
        if (noCache != true) {
          if (!localStorage.getItem('trakttv.trending.cache')) {
            return $http.get('trakt-trending-500.json').then(function(result) {
              var output = result.data.filter(function(show) {
                if (show.trakt_id) return true
              })
              localStorage.setItem('trakttv.trending.cache', JSON.stringify(output))
              return output
            })
          } else {
            return $q(function(resolve) {
              resolve(JSON.parse(localStorage.getItem('trakttv.trending.cache')))
            })
          }
        }

        service.cancelTrending()
        service.cancelSearch()
        activeTrendingRequest = $q.defer()
        return promiseRequest('trending', null, null, activeTrendingRequest.promise).then(function(results) {
          activeTrendingRequest = false
          cachedTrending = results
          return results
        })
      },
      cancelTrending: function() {
        if (activeTrendingRequest && activeTrendingRequest.resolve) {
          activeTrendingRequest.resolve()
          activeTrendingRequest = false
        }
      },
      resolveID: function(id, useTrakt_id) {
        var TRAKTorTVDB_ID = useTrakt_id ? 'trakt_id' : 'tvdb_id'
        return promiseRequest(TRAKTorTVDB_ID, id).then(function(result) {
          return result
        }, function(error) {
          throw 'Could not resolve ' + TRAKTorTVDB_ID + ' ' + id + ' from Trakt.TV: ' + error
        })
      },
      /**
       * generate a device code which the user authorizes on trakt web
       * https://docs.trakt.tv/reference/postoauthdevicecode
       */
      devicecode: function() {
        return $http.post(getOauthUrl('devicecode'), JSON.stringify({
          'client_id': TRAKT_CLIENT_ID
        }), {
          headers: {
            'trakt-api-key': TRAKT_CLIENT_ID,
            'trakt-api-version': 2,
            'Content-Type': 'application/json'
          }
        }).then(function(result) {
          /* example
          result.data.:
          device_code:"xxXwHG0xXAJxQxxxxxWS1jxxxHI6U-xF8x2YExBDxxZx"
          expires_in:600 (seconds)
          interval:6 (seconds)
          user_code:"X5HZX8BX"
          verification_url:"https://auth.trakt.tv/activate"
          */
          // if 200 then present the usercode and the url to user and get them to authorize
          // else error
          // poll got the access token via https://auth.trakt.tv/oauth/device/token
          return result
        }, function(error) {
          throw error
        })
      },
      /**
       * poll for the access token generated once the user completes authorization on their trakt.tv account
       * https://docs.trakt.tv/reference/postoauthdevicetoken
       */
      pollaccesstoken: function(devicecode, expiresin, interval) {
        return $http.post(getOauthUrl('devicetoken'), JSON.stringify({
          'code': devicecode,
          'client_id': TRAKT_CLIENT_ID,
          'client_secret': TRAKT_CLIENT_SECRET
        }), {
          headers: {
            'trakt-api-key': TRAKT_CLIENT_ID,
            'trakt-api-version': 2,
            'Content-Type': 'application/json'
          }
        }).then(function(result) {
          localStorage.setItem('trakttv.token', result.data.access_token)
          localStorage.setItem('trakttv.refresh_token', result.data.refresh_token)
          return result.data.access_token
        }, function(err) {
          if (err.status == 400) {
            // Pending - waiting for the user to authorize your app
            console.debug('Pending - waiting for the user to authorize your app, retry in %s seconds', interval)
            return delay(interval * 1000).then(function() {
              return service.pollaccesstoken(devicecode, expiresin, interval)
            })
          }
          if (err.status == 404) {
            // Not Found - invalid device_code
            throw 'Error 404: Not Found - invalid device_code'
          }
          if (err.status == 409) {
            // Already Used - user already approved this code
            throw 'Error 409: Already Used - user already approved this code'
          }
          if (err.status == 410) {
            // Expired - the tokens have expired, restart the process
            throw 'Error 410: Expired - the tokens have expired, restart the process'
          }
          if (err.status == 418) {
            // Denied - user explicitly denied this code
            throw 'Error 418: Denied - user explicitly denied this code'
          }
          if (err.status == 429) {
            // Slow Down - your app is polling too quickly
            var headers = err && err.headers ? err.headers() : {}
            var retryAfterSeconds = +headers['retry-after']
            retryAfterSeconds  = retryAfterSeconds ? retryAfterSeconds : interval
            console.error('Trakt poll access token rate limited! trying again in %s seconds', retryAfterSeconds)
            return delay(retryAfterSeconds * 1000).then(function() {
              return service.pollaccesstoken(devicecode, expiresin, interval)
            })
          }
          if (err.status !== 0) { // only if this is not a cancelled request, rethrow
            throw 'Error ' + err.status + ':' + err.statusText
          }
        })
      },
      /**
       * Exchange refresh_token for access token.
       * https://docs.trakt.tv/reference/postoauthtoken
       */
      renewToken: function() {
        return $http.post(getOauthUrl('token'), JSON.stringify({
          'refresh_token': localStorage.getItem('trakttv.refresh_token'),
          'client_id': TRAKT_CLIENT_ID,
          'client_secret': TRAKT_CLIENT_SECRET,
          'redirect_uri': REDIRECT_URI,
          'grant_type': 'refresh_token'
        }), {
          headers: {
            'trakt-api-key': TRAKT_CLIENT_ID,
            'trakt-api-version': 2,
            'Content-Type': 'application/json'
          }
        }).then(function(result) {
          console.warn('Token has been renewed')
          localStorage.setItem('trakttv.token', result.data.access_token)
          localStorage.setItem('trakttv.refresh_token', result.data.refresh_token)
          return result.data.access_token
        }, function(error) {
          throw error
        })
      },
      /**
       * Returns all shows a user has watched.
       * https://docs.trakt.tv/reference/getsyncwatched
       */
      watched: function() {
        return promiseRequest('watched').then(function(result) {
          console.info('Fetched V2 API watched results: ', result)
          return result
        })
      },
      /**
       * Mark an episode as watched.
       *https://docs.trakt.tv/reference/postsynchistoryadd
       */
      markEpisodeWatched: function(serie, episode) {
        return performPost('episodeSeen', {
          episodes: [{
            'watched_at': new Date(episode.watchedAt).toISOString(),
            ids: {
              trakt: episode.TRAKT_ID
            }
          }]
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("Episode watched:", serie, episode, result)
          return result
        })
      },
      /**
       * Batch mark episodes as watched.
       *https://docs.trakt.tv/reference/postsynchistoryadd
       */
      markEpisodesWatched: function(episodes) {
        var episodesArray = []
        angular.forEach(episodes, function(episode) {
          episodesArray.push({
            'watched_at': new Date(episode.watchedAt).toISOString(),
            'ids': {
              trakt: episode.TRAKT_ID
            }
          })
        })
        return performPost('episodeSeen', {
          episodes: episodesArray
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("trakt.TV episodes marked as watched:", episodes, result)
          return result
        })
      },
      /**
       * Mark an episode as not watched.
       * https://docs.trakt.tv/reference/postsynchistoryremove
       */
      markEpisodeNotWatched: function(serie, episode) {
        return performPost('episodeUnseen', {
          episodes: [{
            ids: {
              trakt: episode.TRAKT_ID
            }
          }]
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("Episode un-watched:", serie, episode, result)
          return result
        })
      },
      /**
       * Returns all shows in a users collection.
       * https://docs.trakt.tv/reference/getsynccollectionall
       */
      userShows: function() {
        return promiseRequest('userShows').then(function(result) {
          console.info('Fetched V2 API User Shows: ', result)
          return result
        })
      },
      /**
       * add a show to a users collection.
       * https://docs.trakt.tv/reference/postsynccollectionadd
       */
      addShowToCollection: function(serie) {
        return performPost('addCollection', {
          shows: [{
            ids: {
              trakt: serie.TRAKT_ID
            }
          }]
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("Added series %s to Trakt.TV user's collection.", serie.name, result)
          return result
        })
      },
      /**
       * add an episode to a users collection.
       * https://docs.trakt.tv/reference/postsynccollectionadd
       */
      markEpisodeDownloaded: function(serie, episode) {
        return performPost('addCollection', {
          episodes: [{
            ids: {
              trakt: episode.TRAKT_ID
            }
          }]
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("Added episode %s of series %s to Trakt.TV user's collection.", episode.getFormattedEpisode(), serie.name, result)
          return result
        })
      },
      /**
       * removes a show from a users collection.
       * https://docs.trakt.tv/reference/postsynccollectionremove
       */
      removeShowFromCollection: function(serie) {
        return performPost('removeCollection', {
          shows: [{
            ids: {
              trakt: serie.TRAKT_ID
            }
          }]
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("Removed series %s from Trakt.TV user's collection.", serie.name, result)
          return result
        })
      },
      /**
       * removes an episode from a users collection.
       * https://docs.trakt.tv/reference/postsynccollectionremove
       */
      markEpisodeNotDownloaded: function(serie, episode) {
        return performPost('removeCollection', {
          episodes: [{
            ids: {
              trakt: episode.TRAKT_ID
            }
          }]
        }).then(function(result) {
          if (window.debugTraktTVv2) console.debug("Removed episode %s of series %s from Trakt.TV user's collection.", episode.getFormattedEpisode(), serie.name, result)
          return result
        })
      }
    }
    return service
  }
])

  .run(['$rootScope', 'SettingsService', 'TraktTVv2', function($rootScope, SettingsService, TraktTVv2) {
    /**
     * Catch the event when an episode is marked as watched
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:watched', function(evt, episode) {
      if (window.debugTraktTVv2) console.debug("Mark as watched and sync!", episode)
      if (SettingsService.get('trakttv.sync')) {
        CRUD.FindOne('Serie', {
          ID_Serie: episode.get('ID_Serie')
        }).then(function(serie) {
          TraktTVv2.markEpisodeWatched(serie, episode)
        })
      }
    })
    /**
     * Catch the event when an episode is marked as NOT watched
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:notwatched', function(evt, episode) {
      if (window.debugTraktTVv2) console.debug("Mark as not watched and sync!", episode)
      if (SettingsService.get('trakttv.sync')) {
        CRUD.FindOne('Serie', {
          ID_Serie: episode.get('ID_Serie')
        }).then(function(serie) {
          TraktTVv2.markEpisodeNotWatched(serie, episode)
        })
      }
    })
    /**
     * Catch the event when an episode is marked as downloaded
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:downloaded', function(evt, episode) {
      if (window.debugTraktTVv2) console.debug("Mark as downloaded and sync!", episode)
      if (SettingsService.get('trakttv.sync') && SettingsService.get('trakttv.sync-downloaded')) {
        CRUD.FindOne('Serie', {
          ID_Serie: episode.get('ID_Serie')
        }).then(function(serie) {
          TraktTVv2.markEpisodeDownloaded(serie, episode)
        })
      }
    })
    /**
     * Catch the event when an episode is marked as NOT downloaded
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:notdownloaded', function(evt, episode) {
      if (window.debugTraktTVv2) console.debug("Mark as not downloaded and sync!", episode)
      if (SettingsService.get('trakttv.sync') && SettingsService.get('trakttv.sync-downloaded')) {
        CRUD.FindOne('Serie', {
          ID_Serie: episode.get('ID_Serie')
        }).then(function(serie) {
          TraktTVv2.markEpisodeNotDownloaded(serie, episode)
        })
      }
    })
  }])
