angular.module('DuckieTV.providers.trakttvv2', ['DuckieTV.providers.settings'])

/** 
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
.factory('TraktTVv2', ["SettingsService", "$q", "$http",
    function(SettingsService, $q, $http) {

        var activeSearchRequest = false,
            activeTrendingRequest = false,
            cachedTrending = null;

        var APIkey = '90b2bb1a8203e81a0272fb8717fa8b19ec635d8568632e41d1fcf872a2a2d9d0';
        var endpoint = 'https://api-v2launch.trakt.tv/';
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
            watched: 'sync/watched/shows?extended=full,images&limit=10000',
            usershows: 'users/%s/collection/shows?extended=full,images&limit=10000',
            updated: 'shows/updates/%s?limit=10000',
            episodeSeen: 'https://api.trakt.tv/sync/history',
            episodeUnseen: 'https://api.trakt.tv/sync/history/remove'
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
            usershows: function(result) {
                return result.data.map(function(show) {
                    out = parsers.trakt(show.show);
                    return out;
                });

            },
            watched: function(result) {
                return result.data.map(function(show) {
                    out = parsers.trakt(show.show);
                    out.seasons = show.seasons;
                    return out;
                });

            }
        };

        // trakt api methods that require authorisation
        var authorized = [
            'watched', 'usershows'
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
                headers['trakt-user-login'] = localStorage.getItem('trakt.username');
                headers['trakt-user-token'] = localStorage.getItem('trakt.token');
            }
            return $http.get(url, {
                timeout: promise ? promise : 120000,
                headers: headers
            }).then(function(result) {
                return parser(result);
            }, function(err) {
                // if err.code == 400 
                // token auth expired
                // show re-auth dialog
                // restart request and return original promise
                if (err.status != 0) { // only if this is not a cancelled request, rethrow
                    console.error("Trakt tv error!", err);
                    throw "Error " + err.status + ":" + err.statusText;
                }
            });
        };

        var service = {
            serie: function(slug) {
                return promiseRequest('serie', slug).then(function(serie) {
                    return service.people(serie.slug_id).then(function(result) {
                        serie.people = result;
                    }, rethrow).then(function() {
                        return service.seasons(serie.slug_id).then(function(result) {
                            serie.seasons = result;
                        }, rethrow).then(function() {
                            return $q.all(serie.seasons.map(function(season, index) {
                                return service.episodes(serie.slug_id, season.number).then(function(episodes) {
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
            trending: function() {
                if (null !== cachedTrending) {
                    return $q(function(resolve) {
                        resolve(cachedTrending);
                    });
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
                return promiseRequest('tvdb_id', id);
            },
            login: function(username, password) {
                var url = getUrl('login');
                return $http.post(url, JSON.stringify({
                    login: username,
                    password: password
                }), {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    localStorage.setItem('trakt.username', username);
                    localStorage.setItem('trakt.token', result.data.token);
                    return result.data.token;
                }, function(error) {
                    throw error;
                });
            },
            watched: function() {
                return promiseRequest('watched').then(function(result) {
                    console.log("Fetched V2 API watched results: ", result);
                    return result;
                });
            },
            usershows: function() {
                return promiseRequest('usershows', localStorage.getItem('trakt.username')).then(function(result) {
                    console.log("Fetched V2 API User Shows: ", result);

                    return result;
                });
            },
            updated: function(since) {
                return promiseRequest('updated', since);
            },
            /** 
             * Mark an episode as watched.
             * Can be passed either a CRUD entity or a plain series object and an episode.
             * http://trakt.tv/api-docs/show-episode-seen
             */
            markEpisodeWatched: function(serie, episode) {
                var s = (serie instanceof CRUD.Entity) ? serie.get('TVDB_ID') : serie;
                var sn = (episode instanceof CRUD.Entity) ? episode.get('seasonnumber') : episode.seasonnumber;
                var en = (episode instanceof CRUD.Entity) ? episode.get('episodenumber') : episode.episodenumber;

                $http.post(endpoints.episodeSeen, {
                    shows: [{
                        ids: {
                            tvdb: s
                        },
                        seasons: [{
                            number: sn,
                            episodes: [{
                                number: en
                            }]
                        }]
                    }]
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'trakt-user-login': localStorage.getItem('trakt.username'),
                        'trakt-user-token': localStorage.getItem('trakt.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    console.log("Episode watched: ", serie, episode);
                });
            },
            /** 
             * Mark an episode as not watched.
             * Can be passed either a CRUD entity or a plain series object and an episode.
             * http://trakt.tv/api-docs/show-episode-unseen
             */
            markEpisodeNotWatched: function(serie, episode) {
                var s = (serie instanceof CRUD.Entity) ? serie.get('TVDB_ID') : serie;
                var sn = (episode instanceof CRUD.Entity) ? episode.get('seasonnumber') : episode.seasonnumber;
                var en = (episode instanceof CRUD.Entity) ? episode.get('episodenumber') : episode.episodenumber;

                $http.post(endpoints.episodeUnseen, {
                    shows: [{
                        ids: {
                            tvdb: s
                        },
                        seasons: [{
                            number: sn,
                            episodes: [{
                                number: en
                            }]
                        }]
                    }]
                }, {
                    headers: {
                        'trakt-api-key': APIkey,
                        'trakt-api-version': 2,
                        'trakt-user-login': localStorage.getItem('trakt.username'),
                        'trakt-user-token': localStorage.getItem('trakt.token'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }).then(function(result) {
                    console.log("Episode un-watched: ", serie, episode);
                });
            },

        };

        return service;
    }
]);