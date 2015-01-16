angular.module('DuckieTV.providers.trakttvv2', ['DuckieTV.providers.settings'])

/** 
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
.factory('TraktTVv2', function(SettingsService, $q, $http) {

    var activeSearchRequest = false;
    var hasActiveRequest = false;

    var APIkey = '90b2bb1a8203e81a0272fb8717fa8b19ec635d8568632e41d1fcf872a2a2d9d0';
    var endpoint = 'https://api.trakt.tv/';
    /// shows / game - of - thrones / seasons ? extended = full, images

    var endpoints = {
        serie: 'shows/%s?extended=full,images',
        seasons: 'shows/%s/seasons?extended=full,images',
        episodes: 'shows/%s/seasons/%s/episodes?extended=full,images',
        search: 'search?type=show&extended=full,images&query=%s',
        trending: 'shows/trending?extended=full,images&limit=100',
        tvdb_id: 'search?id_type=tvdb&id=%s',
        login: 'auth/login',
        watched: 'sync/watched/shows'
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
            return show;
        },
        seasons: function(result) {
            return result.data.map(function(season) {
                return parsers.trakt(season);
            });
        },
        search: function(result) {
            data = result.data.map(function(show) {
                return parsers.trakt(show.show);
            });
            return data;
        },
        trending: function(result) {
            data = result.data.map(function(show) {
                return parsers.trakt(show.show);
            });
            return data;
        },
        episodes: function(result) {
            return result.data.map(function(episode) {
                return parsers.trakt(episode);
            });
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
            return parsers.trakt(result.data.filter(function(record) {
                return record.type == "show";
            })[0].show);
        }
    };

    // trakt api methods that require authorisation
    var authorized = [
        'watched'
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
        };
        return $http.get(url, {
            timeout: promise ? promise : 60000,
            headers: headers
        }).then(function(result) {
            return parser(result);
        });
    };

    var service = {
        serie: function(slug) {
            return promiseRequest('serie', slug).then(function(serie) {
                return service.seasons(serie.slug_id).then(function(result) {
                    serie.seasons = result;
                }).then(function() {
                    return $q.all(serie.seasons.map(function(season, index) {
                        return service.episodes(serie.slug_id, season.number).then(function(episodes) {
                            serie.seasons[index].episodes = episodes;
                            return true;
                        });
                    }));
                }).then(function() {
                    return serie;
                });
            });
        },
        seasons: function(slug) {
            return promiseRequest('seasons', slug);
        },
        episodes: function(slug, seasonNumber) {
            return promiseRequest('episodes', slug, seasonNumber);
        },
        search: function(what) {
            service.cancelSearch();
            activeSearchRequest = $q.defer();
            return promiseRequest('search', what, null, activeSearchRequest.promise);
        },
        cancelSearch: function() {
            if (activeSearchRequest && activeSearchRequest.resolve) {
                activeSearchRequest.resolve();
                activeSearchRequest = false;
            }
        },
        trending: function() {
            return promiseRequest('trending');
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
                return true;
            });
        },
        watched: function() {
            return promiseRequest('watched').then(function(result) {
                console.log("Fetched V2 API watched results: ", result);
            })
        }

    };

    return service;
});