/**
 * Fanart Service that handles getting artwork for shows, seasons and episodes and updating them
 */
DuckieTV.factory('FanartService', ['TMDBService', function(TMDBService) {
  const SHOW_ENTITY_TYPE = 1
  const SEASON_ENTITY_TYPE = 2

  async function StoreDataInDb(tmdbId, entityType, posterPath, fanartPath, screenshotPath) {
    const entity = await CRUD.FindOne('TMDBFanart', { entity_type: entityType, tmdb_id: tmdbId }) || new TMDBFanart()
    entity.entity_type = entityType
    entity.TMDB_ID = tmdbId
    entity.poster = TMDBService.getImageUrl(posterPath)
    entity.fanart = TMDBService.getImageUrl(fanartPath, 'original')
    entity.screenshot = TMDBService.getImageUrl(screenshotPath)
    entity.added = Date.now()
    await entity.Persist()
    return entity
  }

  const service = {
    /**
     * Returns images for a show via it's tmdb id from the tmdb fanart database
     * If images for the show haven't been fetched yet, then they will be fetched and stored in the database
     * This does not update any images stored on the Serie (if its in Favorites)
     * @param {object} serie - Serie object containing a tmdb_id
     * @param {boolean} forceUpdate - If true then the images will be fetched from TMDB and stored in the database regardless of whether they already exist
     * @returns {Promise<TMDBFanart | undefined>}
     */
    getShowImages: async function(serie, forceUpdate = false) {
      // hack to support a CRUD Serie or a TraktTV serie object from trending
      const tmdbId = serie.tmdb_id || serie.TMDB_ID
      if (!tmdbId) {
        return
      }

      /** @type {TMDBFanart} */
      let entity = await CRUD.FindOne('TMDBFanart', { entity_type: SHOW_ENTITY_TYPE, tmdb_id: tmdbId })

      // if we're force updating then only update if the entity is older than 4 minutes
      if (forceUpdate && entity && entity.added < Date.now() - 1000 * 60 * 4) {
        entity = null
      }

      if (!entity) {
        entity = await service.updateTmdbImagesForShow(tmdbId)
      }

      // if entity was added more than a month ago then fetch new images in the background
      if (entity && entity.added < Date.now() - 1000 * 60 * 60 * 24 * 28) {
        service.updateTmdbImagesForShow(tmdbId)
      }

      return entity
    },

    /**
     * Returns a poster for a season via it's tmdb id if it exists
     * Season posters are cached in the database when images for the show are fetched
     * If for some reason the show hasn't been fetched yet then no poster will be returned
     * @param {number} seasonTmdbId - The tmdb id of the season
     * @returns {Promise<string | undefined>}
     */
    getSeasonPoster: async function(seasonTmdbId) {
      const entity = await CRUD.FindOne('TMDBFanart', { entity_type: SEASON_ENTITY_TYPE, tmdb_id: seasonTmdbId })
      return entity?.poster
    },

    /**
     * Returns a mapping of episode tmdb ids to episode images for a season
     * To get a season on TMDB you need the show tmdb id and the season number
     * @param showTmdbId - The tmdb id of the show
     * @param seasonNumber - The season number
     * @return {Promise<{}>} - A mapping of episode tmdb ids to episode images
     */
    getEpisodeImagesForSeason: async function(showTmdbId, seasonNumber) {
      const episodeImageMap = {}

      if (!showTmdbId || !(seasonNumber >= 0)) {
        return episodeImageMap
      }

      const season = await TMDBService.getSeason(showTmdbId, seasonNumber)
      if (!season) {
        console.warn('FanartService.getEpisodeImagesFromSeason: got no data for show tmdb id', showTmdbId, 'and season number', seasonNumber)
        return episodeImageMap
      }

      for (const episode of season.episodes) {
        episodeImageMap[episode.id] = TMDBService.getImageUrl(episode.still_path)
      }

      return episodeImageMap
    },

    /**
     * Updates the show images for a serie from TMDB
     * This will also store any season posters for the show
     * @param {number} showTmdbId - The tmdb id of the show
     * @returns {Promise<TMDBFanart | undefined>}
     */
    updateTmdbImagesForShow: async function(showTmdbId) {
      if (!showTmdbId) {
        return
      }

      const showData = await TMDBService.getShow(showTmdbId)
      if (!showData) {
        console.warn('FanartService.updateShowImages: got no data from tmdb for tmdb id', showTmdbId)
      }

      const entity = await StoreDataInDb(showTmdbId, SHOW_ENTITY_TYPE, showData?.poster_path, showData?.backdrop_path, null)

      for (const season of showData?.seasons || []) {
        await StoreDataInDb(season.id, SEASON_ENTITY_TYPE, season.poster_path, null, null)
      }

      return entity
    }
  }

  return service
}])

/**
 * Fanart API v3 service
 * docs: http://docs.fanarttv.apiary.io/#
 */
// DuckieTV.factory('FanartTVService', ['$q', '$http', function($q, $http) {
//   var endpoint = 'https://webservice.fanart.tv/v3/tv/'
//   var API_KEY = 'mæ¶ën|{W´íïtßg½÷¾6mÍ9Õýß'
//
//   function getUrl(tvdb_id) {
//     return [endpoint, tvdb_id, '?api_key=', btoa(API_KEY)].join('')
//   }
//
//   function storeInDB(json, entity) {
//     var art = entity || new Fanart();
//     // remove unused art
//     ['characterart', 'seasonbanner', 'seasonthumb', 'clearart'].map(function(item) {
//       if (item in json) {
//         delete json[item]
//       }
//     })
//     art.TVDB_ID = json.thetvdb_id
//     art.json = json
//     art.poster = service.getTrendingPoster(json)
//     art.Persist()
//     return art
//   }
//
//   var service = {
//     get: function(tvdb_id, refresh) {
//       if (!tvdb_id) {
//         console.info('Could not load fanart for null tvdb_id')
//         return $q.resolve({}) // prevent http-not-found errors
//       }
//       refresh = refresh || false
//       return CRUD.FindOne('Fanart', { TVDB_ID: tvdb_id }).then(function(entity) {
//         if (entity && !refresh) {
//           return entity
//         } else {
//           return $http.get(getUrl(tvdb_id)).then(function(result) {
//             // console.debug('Refreshed fanart for tvdb_id=', tvdb_id);
//             return storeInDB(result.data, entity)
//           }, function(err) {
//             console.error('Could not load fanart for tvdb_id=', tvdb_id, err)
//             return false
//           })
//         }
//       }, function(err) {
//         console.error('Could not load fanart for tvdb_id=', tvdb_id, err)
//         return false
//       })
//     },
//     getTrendingPoster: function(fanart) {
//       // console.debug('fanart.getTrendingPoster', fanart);
//       if (!fanart) {
//         return null
//       }
//       // prefer english over others, and tvposter over clearlogo over hdtvlogo
//       var hdtvlogo
//       var clearlogo
//       var tvposter
//       if ('hdtvlogo' in fanart) {
//         hdtvlogo = fanart.hdtvlogo[0] // default
//         for (var i = 0; i < fanart.hdtvlogo.length; i++) {
//           if (fanart.hdtvlogo[i].lang == 'en') {
//             hdtvlogo = fanart.hdtvlogo[i]
//             break
//           }
//         }
//       }
//       if ('clearlogo' in fanart) {
//         clearlogo = fanart.clearlogo[0] // default
//         for (var i = 0; i < fanart.clearlogo.length; i++) {
//           if (fanart.clearlogo[i].lang == 'en') {
//             clearlogo = fanart.clearlogo[i]
//             break
//           }
//         }
//       }
//       if ('tvposter' in fanart) {
//         tvposter = fanart.tvposter[0] // default
//         for (var i = 0; i < fanart.tvposter.length; i++) {
//           if (fanart.tvposter[i].lang == 'en') {
//             tvposter = fanart.tvposter[i]
//             break
//           }
//         }
//       }
//       if (tvposter && tvposter.lang == 'en')
//         return tvposter.url.replace('/fanart', '/preview')
//       if (clearlogo && clearlogo.lang == 'en')
//         return clearlogo.url.replace('/fanart', '/preview')
//       if (hdtvlogo && hdtvlogo.lang == 'en')
//         return hdtvlogo.url.replace('/fanart', '/preview')
//       if (tvposter)
//         return tvposter.url.replace('/fanart', '/preview')
//       if (clearlogo)
//         return clearlogo.url.replace('/fanart', '/preview')
//       if (hdtvlogo)
//         return hdtvlogo.url.replace('/fanart', '/preview')
//       return null
//     },
//     getSeriesPoster: function(fanart) {
//       // console.debug('fanart.getSeriesPoster', fanart);
//       if (!fanart) {
//         return null
//       }
//       // prefer english over others, and tvposter over clearlogo over hdtvlogo
//       var hdtvlogo
//       var clearlogo
//       var tvposter
//       if ('hdtvlogo' in fanart) {
//         hdtvlogo = fanart.hdtvlogo[0] // default
//         for (var i = 0; i < fanart.hdtvlogo.length; i++) {
//           if (fanart.hdtvlogo[i].lang == 'en') {
//             hdtvlogo = fanart.hdtvlogo[i]
//             break
//           }
//         }
//       }
//       if ('clearlogo' in fanart) {
//         clearlogo = fanart.clearlogo[0] // default
//         for (var i = 0; i < fanart.clearlogo.length; i++) {
//           if (fanart.clearlogo[i].lang == 'en') {
//             clearlogo = fanart.clearlogo[i]
//             break
//           }
//         }
//       }
//       if ('tvposter' in fanart) {
//         tvposter = fanart.tvposter[0] // default
//         for (var i = 0; i < fanart.tvposter.length; i++) {
//           if (fanart.tvposter[i].lang == 'en') {
//             tvposter = fanart.tvposter[i]
//             break
//           }
//         }
//       }
//       if (tvposter && tvposter.lang == 'en')
//         return tvposter.url
//       if (clearlogo && clearlogo.lang == 'en')
//         return clearlogo.url
//       if (hdtvlogo && hdtvlogo.lang == 'en')
//         return hdtvlogo.url
//       if (tvposter)
//         return tvposter.url
//       if (clearlogo)
//         return clearlogo.url
//       if (hdtvlogo)
//         return hdtvlogo.url
//       return null
//     },
//     getSeriesBackground: function(fanart) {
//       // console.debug('fanart.getSeriesBackground', fanart);
//       if (!fanart) {
//         return null
//       }
//       // prefer english over others, and showbackground over hdclearart
//       var hdclearart
//       var showbackground
//       if ('hdclearart' in fanart) {
//         hdclearart = fanart.hdclearart[0] // default
//         for (var i = 0; i < fanart.hdclearart.length; i++) {
//           if (fanart.hdclearart[i].lang == 'en') {
//             hdclearart = fanart.hdclearart[i]
//             break
//           }
//         }
//       }
//       if ('showbackground' in fanart) {
//         showbackground = fanart.showbackground[0] // default
//         for (var i = 0; i < fanart.showbackground.length; i++) {
//           if (fanart.showbackground[i].lang == 'en') {
//             showbackground = fanart.showbackground[i]
//             break
//           }
//         }
//       }
//       if (showbackground && showbackground.lang == 'en')
//         return showbackground.url
//       if (hdclearart && hdclearart.lang == 'en')
//         return hdclearart.url
//       if (showbackground)
//         return showbackground.url
//       if (hdclearart)
//         return hdclearart.url
//       return null
//     },
//     getSeriesBanner: function(fanart) {
//       // console.debug('fanart.getSeriesBanner', fanart);
//       if (!fanart) {
//         return null
//       }
//       // prefer english over others
//       var tvbanner
//       if ('tvbanner' in fanart) {
//         tvbanner = fanart.tvbanner[0] // default
//         for (var i = 0; i < fanart.tvbanner.length; i++) {
//           if (fanart.tvbanner[i].lang == 'en') {
//             tvbanner = fanart.tvbanner[i]
//             break
//           }
//         }
//       }
//       if (tvbanner && tvbanner.lang == 'en')
//         return tvbanner.url
//       if (tvbanner)
//         return tvbanner.url
//       return null
//     },
//     getSeasonPoster: function(seasonnumber, fanart) {
//       // console.debug('fanart.getSeasonPoster', seasonnumber, fanart);
//       if (!fanart) {
//         return null
//       }
//       // prefer english over others, and seasonposter over tvposter
//       var seasonposter
//       var tvposter
//       if ('seasonposter' in fanart) {
//         var hit = fanart.seasonposter.filter(function(image) {
//           return parseInt(image.season) == parseInt(seasonnumber)
//         })
//         if (hit && hit.length > 0) {
//           seasonposter = hit[0] // default
//           for (var i = 0; i < hit.length; i++) {
//             if (hit[i].lang == 'en') {
//               seasonposter = hit[i]
//               break
//             }
//           }
//         }
//       }
//       if (('tvposter' in fanart)) {
//         tvposter = fanart.tvposter[0] // default
//         for (var i = 0; i < fanart.tvposter.length; i++) {
//           if (fanart.tvposter[i].lang == 'en') {
//             tvposter = fanart.tvposter[i]
//             break
//           }
//         }
//       }
//       if (seasonposter && seasonposter.lang == 'en')
//         return seasonposter.url
//       if (tvposter && tvposter.lang == 'en')
//         return tvposter.url
//       if (seasonposter)
//         return seasonposter.url
//       if (tvposter)
//         return tvposter.url
//       return null
//     },
//     getEpisodePoster: function(fanart) {
//       // console.debug('fanart.getEpisodePoster', fanart);
//       if (!fanart) {
//         return null
//       }
//       // prefer english over others, and tvthumb over hdtvlogo
//       var tvthumb
//       var hdtvlogo
//       if (('tvthumb' in fanart)) {
//         tvthumb = fanart.tvthumb[0] // default
//         for (var i = 0; i < fanart.tvthumb.length; i++) {
//           if (fanart.tvthumb[i].lang == 'en') {
//             tvthumb = fanart.tvthumb[i]
//             break
//           }
//         }
//       }
//       if ('hdtvlogo' in fanart) {
//         hdtvlogo = fanart.hdtvlogo[0] // default
//         for (var i = 0; i < fanart.hdtvlogo.length; i++) {
//           if (fanart.hdtvlogo[i].lang == 'en') {
//             hdtvlogo = fanart.hdtvlogo[i]
//             break
//           }
//         }
//       }
//       if (tvthumb && tvthumb.lang == 'en')
//         return tvthumb.url
//       if (hdtvlogo && hdtvlogo.lang == 'en')
//         return hdtvlogo.url
//       if (tvthumb)
//         return tvthumb.url
//       if (hdtvlogo)
//         return hdtvlogo.url
//       return null
//     },
//     /**
//      * To populate fanart.cache
//      */
//     store: function() {
//       var cache = {}
//       CRUD.Find('Fanart', {}, { 'limit': '0,99999' }).then(function(result) {
//         result.map(function(fanart) {
//           cache[fanart.TVDB_ID] = fanart.json
//         })
//         localStorage.setItem('fanart.cache', JSON.stringify(cache))
//       })
//     },
//     /**
//      * Populate fanart cache if there is none
//      */
//     initialize: function() {
//       if (localStorage.getItem('fanart.cache')) {
//         var cache = JSON.parse(localStorage.getItem('fanart.cache'))
//         Object.keys(cache).map(function(tvdb_id) {
//           storeInDB(cache[tvdb_id])
//         })
//         localStorage.removeItem('fanart.cache')
//       }
//       if (!localStorage.getItem('fanart.bootstrapped')) {
//         $http.get('fanart.cache.json').then(function(result) {
//           return Promise.all(Object.keys(result.data).map(function(tvdb_id) {
//             return storeInDB(result.data[tvdb_id])
//           }))
//         }).then(function() {
//           localStorage.setItem('fanart.bootstrapped', 1)
//         })
//       }
//     }
//   }
//   return service
// }
// ])
//
// DuckieTV.run(['FanartTVService', function(FanartTVService) {
//   FanartTVService.initialize()
// }])
