/** 
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
DuckieTV.factory('TraktTVv2', ["SettingsService", "$q", "$http", "toaster",
    function(SettingsService, $q, $http, toaster) {

        var activeSearchRequest = false,
            activeTrendingRequest = false,
            cachedTrending = null;

        var APIkey = '90b2bb1a8203e81a0272fb8717fa8b19ec635d8568632e41d1fcf872a2a2d9d0';
        var endpoint = 'https://api-v2launch.trakt.tv/';
        var pinUrl = 'https://trakt.tv/pin/948';
        /// shows / game - of - thrones / seasons ? extended = full, images

        var endpoints = {
            people: 'shows/%s/people',
            serie: 'shows/%s?extended=full,images',
            seasons: 'shows/%s/seasons?extended=full,images',
            episodes: 'shows/%s/seasons/%s/episodes?extended=full,images',
            search: 'search?type=show&extended=full,images&query=%s&limit=50',
            trending: 'shows/trending?extended=full,images&limit=500',
            tvdb_id: 'search?id_type=tvdb&id=%s',
            login: 'auth/login',
            updated: 'shows/updates/%s?limit=10000',
            config: 'users/settings',
            token: 'oauth/token',
            watched: 'sync/watched/shows?extended=full,images&limit=10000',
            episodeSeen: 'sync/history',
            episodeUnseen: 'sync/history/remove',
            userShows: 'sync/collection/shows?extended=full,images&limit=10000',
            addCollection: 'sync/collection',
            removeCollection: 'sync/collection/remove'
        };

        var parsers = {
            /** 
             * When the series lists are fetched, put the poster / banner / fanart properties on the main
             * object instead of inside data.images. This makes sure that the API between the CRUD entity and the
             * incoming data is the same.
             */
            trakt: function(show) {
                Object.keys(show.ids).map(function(key) {
                    show[key + '_id'] = show.ids[key];
                });
                if ('images' in show) {
                    if ('fanart' in show.images) {
                        show.fanart = show.images.fanart.full;
                    }
                    if ('poster' in show.images) {
                        show.poster = show.images.poster.thumb;
                    }
                    if ('banner' in show.images) {
                        show.banner = 'thumb' in show.images.banner ? show.images.banner.thumb : show.images.banner.full;
                    }
                }
                if ('title' in show) {
                    show.name = show.title;
                }
                return show;
            },
            people: function(result) {
                return result.data;
            },
            seasons: function(result) {
                return result.data.map(function(season) {
                    return parsers.trakt(season);
                });
            },
            search: function(result) {
                return result.data.map(function(show) {
                    return parsers.trakt(show.show);
                });
            },
            trending: function(result) {
                return result.data.map(function(show) {
                    return parsers.trakt(show.show);
                });
            },
            episodes: function(result) {
                var map = [],
                    episodes = [];

                result.data.map(function(episode) {
                    if (map.indexOf(episode.number) > -1 || episode.number === 0) return;
                    episodes.push(parsers.trakt(episode));
                    map.push(episode.number);
                });
                return episodes;
            },
            /**
             * Trakt returns a list of search results here. We want only the first object that has a serie detail object in it.
             * @param  trakt result data
             * @return serie parsed serie
             */
            serie: function(result) {
                return parsers.trakt(result.data);
            },
            tvdb_id: function(result) {
                var results = result.data.filter(function(record) {
                    return record.type == "show";
                });
                if (results.length > 0) {
                    return parsers.trakt(results[0].show);
                } else {
                    throw "No results for search by tvdb_id";
                }
            },
            updated: function(result) {
                return result.data.map(function(show) {
                    out = parsers.trakt(show.show);
                    out.remote_updated = show.updated_at;
                    return out;
                });
            },
            watched: function(result) {
                return result.data.map(function(show) {
                    out = parsers.trakt(show.show);
                    out.seasons = show.seasons;
                    return out;
                });
            },
            userShows: function(result) {
                return result.data.map(function(show) {
                    out = parsers.trakt(show.show);
                    return out;
                });
            }
        };

        // trakt api GET methods that require authorisation
        var authorized = [
            'watched', 'userShows', 'config'
        ];

        /** 
         * Get one of the urls from the endpoint and replace the parameters in it when provided.
         */
        var getUrl = function(type, param, param2) {
            var out = endpoint + endpoints[type].replace('%s', encodeURIComponent(param));
            return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
        };

        /** 
         * If a customized parser is available for the data, run it through that.
         */
        var getParser = function(type) {
            return type in parsers ? parsers[type] : function(data) {
                return data.data;
            };
        };

        /**
         * Generic error-catching and re-throwing
         */
        var rethrow = function(err) {
            throw err;
        };

        /** 
         * Promise requests with batchmode toggle to auto-kill a previous request when running.
         * The activeRequest and batchMode toggles make sure that find-as-you-type can execute multiple
         * queries in rapid succession by aborting the previous one. Can be turned off at will by using enableBatchMode()
         */
        var promiseRequest = function(type, param, param2, promise) {

            var url = getUrl(type, param, param2);
            var parser = getParser(type);
            var headers = {
                'trakt-api-key': APIkey,
                'trakt-api-version': 2,
                'accept': 'application/json'
            };
            if (authorized.indexOf(type) > -1) {
                headers.Authorization = 'Bearer ' + localStorage.getItem('trakttv.token');
            }
            return $http.get(url, {
                timeout: promise ? promise : 120000,
                headers: headers,
                cache: false,
            }).then(function(result) {
                return parser(result);
            }, function(err) {
                if (err.code == 401) {
                    // token auth expired, renew
                    service.renewToken();
                    // restart request and return original promise
                    return service.promiseRequest(type, param, param2, promise);
                };
                if (err.status !== 0) { // only if this is not a cancelled request, rethrow
                    console.error("Trakt tv error!", err);
                    throw "Error " + err.status + ":" + err.statusText;
                }
            });
        };

        var service = {
            serie: function(slug) {
                return promiseRequest('serie', slug).then(function(serie) {
                    return service.people(serie.trakt_id).then(function(result) {
                        serie.people = result;
                    }, rethrow).then(function() {
                        return service.seasons(serie.trakt_id).then(function(result) {
                            serie.seasons = result;
                        }, rethrow).then(function() {
                            return $q.all(serie.seasons.map(function(season, index) {
                                return service.episodes(serie.trakt_id, season.number).then(function(episodes) {
                                    serie.seasons[index].episodes = episodes;
                                    return true;
                                }, rethrow);
                            }));
                        }, rethrow).then(function() {
                            return serie;
                        }, rethrow);
                    });
                });
            },
            seasons: function(slug) {
                return promiseRequest('seasons', slug);
            },
            episodes: function(slug, seasonNumber) {
                return promiseRequest('episodes', slug, seasonNumber);
            },
            people: function(slug) {
                return promiseRequest('people', slug);
            },
            search: function(what) {
                service.cancelTrending();
                service.cancelSearch();
                activeSearchRequest = $q.defer();
                return promiseRequest('search', what, null, activeSearchRequest.promise).then(function(results) {
                    activeSearchRequest = false;
                    return results;
                });
            },
            cancelSearch: function() {
                if (activeSearchRequest && activeSearchRequest.resolve) {
                    activeSearchRequest.reject("search abort");
                    activeSearchRequest = false;
                }
            },
            hasActiveSearchRequest: function() {
                return (activeSearchRequest && activeSearchRequest.resolve);
            },
            trending: function(noCache) {
                if (undefined === noCache) {
                    if (!localStorage.getItem('trakttv.trending.cache')) {
                        return $http.get('trakt-trending-500.json').then(function(result) {
                            var output = result.data.filter(function(show) {
                                return typeof(show.show.ids.tvdb) !== "undefined";
                            }).map(function(show) {
                                return parsers.trakt(show.show);
                            });
                            return output;
                        });
                    } else {
                        return $q(function(resolve) {
                            resolve(JSON.parse(localStorage.getItem('trakttv.trending.cache')));
                        });
                    }
                }

                service.cancelTrending();
                service.cancelSearch();
                activeTrendingRequest = $q.defer();
                return promiseRequest('trending', null, null, activeTrendingRequest.promise).then(function(results) {
                    activePromiseRequest = false;
                    cachedTrending = results;
                    return results;
                });
            },
            cancelTrending: function() {
                if (activeTrendingRequest && activeTrendingRequest.resolve) {
                    activeTrendingRequest.resolve();
                    activeTrendingRequest = false;
                }
            },
            resolveTVDBID: function(id) {
                return promiseRequest('tvdb_id', id).then(function(result) {
                    return result;
                }, function(error) {
                    toaster.pop('error', 'Error fetching from Trakt.TV', 'Could not find serie by TVDB_ID: ' + id + '<br>' + error, null);
                    throw "Could not resolve TVDB_ID " + id + " from Trakt.TV: " + error;
                });
            },
            getPinUrl: function() {
                return pinUrl;
            },
            /** 
             * Exchange code for access token.
             * http://docs.trakt.apiary.io/#reference/authentication-oauth/get-token/exchange-code-for-access_token
             */
            login: function(pin) {
                return $http.post(getUrl('token'), JSON.stringify({
                    'code': pin,
                    'client_id': '90b2bb1a8203e81a0272fb8717fa8b19ec635d8568632e41d1fcf872a2a2d9d0',
                    'client_secret': 'f1c3e2df8f7a5e2705879fb33db655bc4aa96c0f33a674f3fc7749211ea46794',
                    'redirect_uri': 'urn:ietf:wg:oauth:2.0:oob',
                    'grant_type': 'authorization_code',
                }), {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Content-Type': 'application/json'
                    }
                }).then(function(result) {
                    localStorage.setItem('trakttv.token', result.data.access_token);
                    localStorage.setItem('trakttv.refresh_token', result.data.refresh_token);
                    return result.data.access_token;
                }, function(error) {
                    throw error;
                });
            },
            /** 
             * Exchange refresh_token for access token.
             * http://docs.trakt.apiary.io/#reference/authentication-oauth/get-token/exchange-refresh_token-for-access_token
             */
            renewToken: function() {
                return $http.post(getUrl('token'), JSON.stringify({
                    'refresh_token': localStorage.getItem('trakttv.refresh_token'),
                    'client_id': '90b2bb1a8203e81a0272fb8717fa8b19ec635d8568632e41d1fcf872a2a2d9d0',
                    'client_secret': 'f1c3e2df8f7a5e2705879fb33db655bc4aa96c0f33a674f3fc7749211ea46794',
                    'redirect_uri': 'urn:ietf:wg:oauth:2.0:oob',
                    'grant_type': 'refresh_token',
                }), {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Content-Type': 'application/json'
                    }
                }).then(function(result) {
                    console.warn('Token has been renewed');
                    localStorage.setItem('trakttv.token', result.data.access_token);
                    localStorage.setItem('trakttv.refresh_token', result.data.refresh_token);
                    return result.data.access_token;
                }, function(error) {
                    throw error;
                });
            },
            /** 
             * Returns recently updated shows.
             * http://docs.trakt.apiary.io/#reference/shows/updates/get-recently-updated-shows
             */
            updated: function(since) {
                return promiseRequest('updated', since);
            },
            /** 
             * Returns all shows a user has watched.
             * http://docs.trakt.apiary.io/#reference/sync/get-watched/get-watched
             */
            watched: function() {
                return promiseRequest('watched').then(function(result) {
                    console.info("Fetched V2 API watched results: ", result);
                    return result;
                });
            },
            /** 
             * Mark an episode as watched.
             * http://docs.trakt.apiary.io/#reference/sync/add-to-history/add-items-to-watched-history
             */
            markEpisodeWatched: function(serie, episode) {
                $http.post(getUrl('episodeSeen'), {
                    episodes: [{
                        'watched_at': new Date(episode.watchedAt).toISOString(),
                        ids: {
                            trakt: episode.TRAKT_ID
                        }
                    }]
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Authorization': 'Bearer ' + localStorage.getItem('trakttv.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    //console.debug("Episode watched:", serie, episode);
                });
            },
            /** 
             * Batch mark episodes as watched.
             * http://docs.trakt.apiary.io/#reference/sync/add-to-history/add-items-to-watched-history
             */
            markEpisodesWatched: function(episodes) {
                var episodesArray = [];
                angular.forEach(episodes, function(episode) {
                    episodesArray.push({
                        'watched_at': new Date(episode.watchedAt).toISOString(),
                        'ids': {
                            trakt: episode.TRAKT_ID
                    }});
                });
                $http.post(getUrl('episodeSeen'), {
                    episodes: episodesArray
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Authorization': 'Bearer ' + localStorage.getItem('trakttv.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    console.debug("trakt.TV episodes marked as watched:", episodes, result);
                });
            },
            /** 
             * Mark an episode as not watched.
             * http://docs.trakt.apiary.io/#reference/sync/remove-from-history/remove-items-from-history
             */
            markEpisodeNotWatched: function(serie, episode) {
                var s = (serie instanceof CRUD.Entity) ? serie.get('TVDB_ID') : serie;
                var sn = episode.seasonnumber;
                var en = episode.episodenumber;

                $http.post(getUrl('episodeUnseen'), {
                    movies: [],
                    shows: [],
                    episodes: [{
                        ids: {
                            trakt: episode.TRAKT_ID
                        }
                    }]
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Authorization': 'Bearer ' + localStorage.getItem('trakttv.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    //console.debug("Episode un-watched:", serie, episode);
                });
            },
            /** 
             * Returns all shows in a users collection.
             * http://docs.trakt.apiary.io/#reference/sync/get-collection/get-collection
             */
            userShows: function() {
                return promiseRequest('userShows').then(function(result) {
                    console.info("Fetched V2 API User Shows: ", result);

                    return result;
                });
            },
            /** 
             * add all shows to a users collection.
             * http://docs.trakt.apiary.io/#reference/sync/add-to-collection/add-items-to-collection
             */
            addToCollection: function(serieID) {
                $http.post(getUrl('addCollection'), {
                    shows: [{
                        ids: {
                            tvdb: serieID
                        }
                    }]
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Authorization': 'Bearer ' + localStorage.getItem('trakttv.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    console.info("Show added to collection:", serieID);
                });
            },
            /** 
             * removes all shows from a users collection.
             * http://docs.trakt.apiary.io/#reference/sync/remove-from-collection/remove-items-from-collection
             */
            removeFromCollection: function(serieID) {
                $http.post(getUrl('removeCollection'), {
                    shows: [{
                        ids: {
                            tvdb: serieID
                        }
                    }]
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Authorization': 'Bearer ' + localStorage.getItem('trakttv.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    console.info("Removed serie from collection", serieID);
                });
            }
        };
        return service;
    }
])

.run(["$rootScope", "SettingsService", "TraktTVv2", function($rootScope, SettingsService, TraktTVv2) {
    /**
     * Catch the event when an episode is marked as watched
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:watched', function(evt, episode) {
        //console.log("Mark as watched and sync!");
        if (SettingsService.get('trakttv.sync')) {
            CRUD.FindOne('Serie', {
                ID_Serie: episode.get('ID_Serie')
            }).then(function(serie) {
                TraktTVv2.markEpisodeWatched(serie, episode);
            });
        }
    });
    /**
     * Catch the event when an episode is marked as NOT watched
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:notwatched', function(evt, episode) {
        if (SettingsService.get('trakttv.sync')) {
            CRUD.FindOne('Serie', {
                ID_Serie: episode.get('ID_Serie')
            }).then(function(serie) {
                TraktTVv2.markEpisodeNotWatched(serie, episode);
            });
        }
    });
}]);
