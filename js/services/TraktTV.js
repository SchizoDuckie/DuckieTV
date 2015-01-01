angular.module('DuckieTV.providers.trakttv', ['DuckieTV.providers.settings'])

/** 
 * Trakt TV API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://trakt.tv/api-docs
 */
.factory('TraktTV', function(SettingsService, $q, $http, $rootScope) {

    var activeRequest = false;
    var hasActiveRequest = false;

    var endpoints = {
        series: 'http://api.trakt.tv/search/shows.json/dc6cdb4bcbc5cb9f2b666202a10353d6?query=%s',
        season: 'http://api.trakt.tv/show/seasons.json/dc6cdb4bcbc5cb9f2b666202a10353d6/%s',
        episode: 'http://api.trakt.tv/show/season.json/dc6cdb4bcbc5cb9f2b666202a10353d6/%s/%s',
        seriebyid: 'http://api.trakt.tv/show/summary.json/dc6cdb4bcbc5cb9f2b666202a10353d6/%s/extended',
        summarybyid: 'http://api.trakt.tv/show/summary.json/dc6cdb4bcbc5cb9f2b666202a10353d6/%s',
        trending: 'http://api.trakt.tv/shows/trending.json/dc6cdb4bcbc5cb9f2b666202a10353d6',
        userShows: 'https://api.trakt.tv/user/library/shows/all.json/dc6cdb4bcbc5cb9f2b666202a10353d6/%s',
        userWatched: 'https://api.trakt.tv/user/library/shows/watched.json/dc6cdb4bcbc5cb9f2b666202a10353d6/%s/true',
        userSuggestions: 'https://api.trakt.tv/recommendations/shows/dc6cdb4bcbc5cb9f2b666202a10353d6',
        episodeSeen: 'https://api.trakt.tv/show/episode/seen/dc6cdb4bcbc5cb9f2b666202a10353d6', // https://trakt.tv/api-docs/show-episode-seen
        episodeUnseen: 'https://api.trakt.tv/show/episode/unseen/dc6cdb4bcbc5cb9f2b666202a10353d6', // https://trakt.tv/api-docs/show-episode-seen
        addToLibrary: 'https://api.trakt.tv/show/library/dc6cdb4bcbc5cb9f2b666202a10353d6',
        accountTest: 'https://api.trakt.tv/account/test/dc6cdb4bcbc5cb9f2b666202a10353d6'
    };

    var parsers = {
        /** 
         * When the series lists are fetched, put the poster / banner / fanart properties on the main
         * object instead of inside data.images. This makes sure that the API between the CRUD entity and the
         * incoming data is the same.
         */
        series: function(data) {
            if (!data) return {
                series: []
            };
            data = data.data;
            if (!data || !'length' in data) return;
            for (var i = 0; i < data.length; i++) {
                data[i].poster = ('images' in data[i] && 'poster' in data[i].images) ? data[i].images.poster : '';
                data[i].banner = ('images' in data[i] && 'banner' in data[i].images) ? data[i].images.banner : '';
                data[i].fanart = ('images' in data[i] && 'fanart' in data[i].images) ? data[i].images.fanart : '';
            }
            return {
                series: data
            };
        }
    };

    /** 
     * Get one of the urls from the endpoint and replace the parameters in it when provided.
     */
    var getUrl = function(type, param, param2) {
        var out = endpoints[type].replace('%s', encodeURIComponent(param));
        return (param2 !== undefined) ? out.replace('%s ', encodeURIComponent(param2)) : out;
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
    var promiseRequest = function(type, param, param2) {
        if (activeRequest && !service.batchmode) {
            activeRequest.resolve();
        }
        var d = $q.defer();
        var url = getUrl(type, param, param2);
        var parser = getParser(type);
        activeRequest = $q.defer();
        hasActiveRequest = true;
        $http.get(url, {
            cache: true,
            timeout: activeRequest.promise
        }).then(function(response) {
            hasActiveRequest = false;
            return d.resolve(parser(response));
        }).catch(function(error) {
            if (error.status === 0) { // rejected promises
                return d.resolve([]);
            }
            hasActiveRequest = false;
            return d.reject(error);
        });
        return d.promise;
    };

    var service = {
        batchMode: false,
        /** 
         * enableBatchMode makes sure previous request are not aborted.
         * Batch mode is required to be turned on for FavoritesService operations
         * and batch imports, so that the previous requests can finish and all the promises
         * will run.
         */
        enableBatchMode: function() {
            service.batchmode = true;
            return service;
        },
        /** 
         * disableBatchMode turns off batch mode and makes sure previous active requests are
         * terminated before starting the next.
         */
        disableBatchMode: function() {
            service.batchmode = false;
            return service;
        },
        /** 
         * Search Trakt.TV for series info by name
         * http://trakt.tv/api-docs/search-shows
         */
        findSeries: function(name) {
            return promiseRequest('series', name);
        },
        /** 
         * Fetch full series info from trakt.tv by TVDB_ID
         * http://trakt.tv/api-docs/show-summary
         */
        findSerieByTVDBID: function(TVDB_ID, summaryOnly) {
            return promiseRequest(summaryOnly ? 'summarybyid' : 'seriebyid', TVDB_ID);
        },
        /** 
         * Fetch trending shows from trakt.tv
         * http://trakt.tv/api-docs/shows-trending
         */
        findTrending: function() {
            return promiseRequest('trending', '').then(function(series) {
                return series.map(function(serie) {
                    serie.poster = serie.images.poster;
                    return serie;
                });
            });
        },
        /** 
         * Fetch all shows in a user's library.
         * http://trakt.tv/api-docs/user-library-shows-all
         */
        getUserShows: function(username) {
            return $http.post(getUrl('userShows', username), {
                "username": SettingsService.get('trakttv.username'),
                "password": SettingsService.get('trakttv.passwordHash'),
            }).then(function(result) {
                console.log("TraktTV user shows retrieved!", result);
                result.data.map(function(show) {
                    show.poster = show.images.poster;
                });
                return result.data;
            });
        },
        /** 
         * Fetch all episodes that were marked as watched foor the user
         * http://trakt.tv/api-docs/user-library-shows-watched
         */
        getUserWatched: function(username) {
            return $http.post(getUrl('userWatched', username), {
                "username": SettingsService.get('trakttv.username'),
                "password": SettingsService.get('trakttv.passwordHash'),
            }).then(function(result) {
                console.log("TraktTV user watched retrieved!", result);
                result.data.map(function(show) {
                    show.poster = show.images.poster;
                });
                return result.data;
            });
        },
        /** 
         * Fetch suggestions based on a user's library.
         * Requires the authentication hash to be calculated and stored.
         * http://trakt.tv/api-docs/recommendations-shows
         */
        getUserSuggestions: function() {
            return $http.post(endpoints.userSuggestions, {
                "username": SettingsService.get('trakttv.username'),
                "password": SettingsService.get('trakttv.passwordHash'),
            }).then(function(result) {
                console.log("TraktTV suggestions retrieved!", result);
                result.data.map(function(show) {
                    show.poster = show.images.poster;
                });
            });
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
                "username": SettingsService.get('trakttv.username'),
                "password": SettingsService.get('trakttv.passwordHash'),
                "tvdb_id": s,
                "episodes": [{
                    "season": sn,
                    "episode": en
                }]
            }).then(function(result) {
                //console.log("Episode watched: ", serie, episode);
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
                "username": SettingsService.get('trakttv.username'),
                "password": SettingsService.get('trakttv.passwordHash'),
                "tvdb_id": s,
                "episodes": [{
                    "season": sn,
                    "episode": en
                }]
            }).then(function(result) {
                //console.log("Episode un-watched: ", serie, episode);
            });
        },
        /** 
         * Add a show to the user's library.
         * http://trakt.tv/api-docs/show-library
         */
        addToLibrary: function(serieTVDB_ID) {
            $http.post(endpoints.addToLibrary, {
                "username": SettingsService.get('trakttv.username'),
                "password": SettingsService.get('trakttv.passwordHash'),
                "tvdb_id": serieTVDB_ID,
            }).then(function(result) {
                console.log("Serie added to trakt.tv library: ", serieTVDB_ID);
            });
        },
        /** 
         * Test authentication with trakt.tv
         * Returns either success or failure
         * http://trakt.tv/api-docs/account-test
         */
        checkDetails: function(user, shapass) {
            return $http.post(endpoints.accountTest, {
                "username": user,
                "password": shapass,
            }).then(function(result) {
                console.log("Trakt.tv account-test request successful, response: ", result.data.status);
                return result.data.status;
            }, function(err) {
                //If error we stil need to return something
                //Could use to display more informative errors
                //401 - incorrect user pass ect.
                return err.status;
            });
        },
        hasActiveRequest: function() {
            console.log("Has active request?", hasActiveRequest);

            return hasActiveRequest;
        }
    };

    return service;
})

/** 
 * The focus watch directive checks if the focusWatch property that's been set on the scope changes
 * and then executes a .focus() on the element.
 * Example: <input focus-watch='test'>
 * controller: $scope.test = true; // autofocus the element.
 */
.directive('focusWatch', function() {
    return {
        restrict: 'A',
        scope: '=',
        link: function($scope, element) {
            if (element[0].getAttribute('focus-watch')) {
                $scope.$watch(element[0].getAttribute('focus-watch'), function() {
                    var el = element.length == 1 && element[0].tagName == 'INPUT' ? element[0] : element.find('input')[0];
                    setTimeout(function() {
                        this.focus();
                    }.bind(el), 500);
                });
            }
        }
    };
});