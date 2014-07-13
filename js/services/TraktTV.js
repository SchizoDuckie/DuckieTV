angular.module('DuckieTV.providers.trakttv', ['DuckieTV.providers.settings'])

/** 
 * Trakt TV API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *  
 * For API docs: check here: http://trakt.tv/api-docs
 */
.provider('TraktTV', function() {
    this.http = null;
    this.promise = null;
    this.activeRequest = null;
    this.batchmode = true;

    this.endpoints = {
        series: 'http://api.trakt.tv/search/shows.json/32e05d4138adb5da5b702b362bd21c52?query=%s',
        season: 'http://api.trakt.tv/show/seasons.json/32e05d4138adb5da5b702b362bd21c52/%s',
        episode: 'http://api.trakt.tv/show/season.json/32e05d4138adb5da5b702b362bd21c52/%s/%s',
        seriebyid: 'http://api.trakt.tv/show/summary.json/32e05d4138adb5da5b702b362bd21c52/%s/extended',
        trending: 'https://api.trakt.tv/shows/trending.json/32e05d4138adb5da5b702b362bd21c52',
        userShows: 'https://api.trakt.tv/user/library/shows/all.json/32e05d4138adb5da5b702b362bd21c52/%s',
        userWatched: 'https://api.trakt.tv/user/library/shows/watched.json/32e05d4138adb5da5b702b362bd21c52/%s/true',
        userSuggestions: 'http://api.trakt.tv/recommendations/shows/32e05d4138adb5da5b702b362bd21c52',
        episodeSeen: 'https://api.trakt.tv/show/episode/seen/32e05d4138adb5da5b702b362bd21c52', // https://trakt.tv/api-docs/show-episode-seen
        episodeUnseen: 'https://api.trakt.tv/show/episode/unseen/32e05d4138adb5da5b702b362bd21c52', // https://trakt.tv/api-docs/show-episode-seen
        addToLibrary: 'https://api.trakt.tv/show/library/32e05d4138adb5da5b702b362bd21c52'
    };

    this.parsers = {
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
    this.getUrl = function(type, param, param2) {
        var out = this.endpoints[type].replace('%s', encodeURIComponent(param));
        console.log("Geturl: ", out, type);
        return (param2 !== undefined) ? out.replace('%s ', encodeURIComponent(param2)) : out;
    };

    /** 
     * If a customized parser is available for the data, run it through that.
     */
    this.getParser = function(type) {
        return type in this.parsers ? this.parsers[type] : function(data) {
            return data.data;
        };
    };

    /** 
     * Promise requests with batchmode toggle to auto-kill a previous request when running.
     * The activeRequest and batchMode toggles make sure that find-as-you-type can execute multiple 
     * queries in rapid succession by aborting the previous one. Can be turned off at will by using enableBatchMode()
     */
    this.promiseRequest = function(type, param, param2) {
        console.log("new promise request!", type, param);
        if (this.activeRequest && !this.batchmode) {
            this.activeRequest.resolve();
        }
        var d = this.promise.defer();
        var url = this.getUrl(type, param, param2);
        var parser = this.getParser(type);
        this.activeRequest = this.promise.defer();
        this.http.get(url, {
            cache: true,
            timeout: this.activeRequest.promise
        }).then(function(response) {
            d.resolve(parser(response));
        }, function(err) {
            console.log('error fetching ', type);
            d.reject(err);
        });
        return d.promise;
    };


    this.$get = function($q, $http, $rootScope, SettingsService) {
        var self = this;
        self.http = $http;
        self.promise = $q;
        return {
            /** 
             * enableBatchMode makes sure previous request are not aborted.
             * Batch mode is required to be turned on for FavoritesService operations
             * and batch imports, so that the previous requests can finish and all the promises
             * will run.
             */
            enableBatchMode: function() {
                self.batchmode = true;
                return self.$get($q, $http);
            },
            /** 
             * disableBatchMode turns off batch mode and makes sure previous active requests are
             * terminated before starting the next.
             */
            disableBatchMode: function() {
                self.batchmode = false;
                return self.$get($q, $http);
            },
            /** 
             * Search Trakt.TV for series info by name
             * http://trakt.tv/api-docs/search-shows
             */
            findSeries: function(name) {
                return self.promiseRequest('series', name);
            },
            /** 
             * Fetch full series info from trakt.tv by TVDB_ID
             * http://trakt.tv/api-docs/show-summary
             */
            findSerieByTVDBID: function(TVDB_ID) {
                return self.promiseRequest('seriebyid', TVDB_ID);
            },
            /** 
             * Fetch trending shows from trakt.tv
             * http://trakt.tv/api-docs/shows-trending
             */
            findTrending: function() {
                return self.promiseRequest('trending', '');
            },
            /** 
             * Fetch all shows in a user's library. 
             * http://trakt.tv/api-docs/user-library-shows-all
             */
            getUserShows: function(username) {
                return self.promiseRequest('userShows', username);
            },
            /** 
             * Fetch all episodes that were marked as watched foor the user
             * http://trakt.tv/api-docs/user-library-shows-watched
             */
            getUserWatched: function(username) {
                return self.promiseRequest('userWatched', username);
            },
            /** 
             * Fetch suggestions based on a user's libary.
             * Requires the authentication hash to be calculated and stored.
             * http://trakt.tv/api-docs/recommendations-shows
             */
            getUserSuggestions: function() {
                return $http.post(self.endpoints.userSuggestions, {
                    "username": SettingsService.get('trakttv.username'),
                    "password": SettingsService.get('trakttv.passwordHash'),
                }).then(function(result) {
                    console.log("TraktTV suggestions retrieved!", result);
                    result.data.map(function(show) {
                        show.poster = show.images.poster;
                    })
                    return result.data;
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
                
                $http.post(self.endpoints.episodeSeen, {
                    "username": SettingsService.get('trakttv.username'),
                    "password": SettingsService.get('trakttv.passwordHash'),
                    "tvdb_id": s,
                    "episodes": [{
                        "season": sn,
                        "episode": en
                    }]
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
              
                $http.post(self.endpoints.episodeUnseen, {
                    "username": SettingsService.get('trakttv.username'),
                    "password": SettingsService.get('trakttv.passwordHash'),
                    "tvdb_id": s,
                    "episodes": [{
                        "season": sn,
                        "episode": en
                    }]
                }).then(function(result) {
                    console.log("Episode watched: ", serie, episode);
                });
            },
            /** 
             * Add a show to the user's library. 
             * http://trakt.tv/api-docs/show-library
             */
            addToLibrary: function(serieTVDB_ID) {
                $http.post(self.endpoints.addToLibrary, {
                    "username": SettingsService.get('trakttv.username'),
                    "password": SettingsService.get('trakttv.passwordHash'),
                    "tvdb_id": serieTVDB_ID,
                }).then(function(result) {
                    console.log("Serie added to trakt.tv library: ", serieTVDB_ID);
                })
            }
        };
    };

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
        scope: {
            'focuswatch': '=focusWatch'
        },
        link: function($scope, element) {
            if ($scope.focuswatch) {
                $scope.$watch($scope.focuswatch, function() {
                    var el = element.length == 1 && element[0].tagName == 'INPUT' ? element[0] : element.find('input')[0];
                    el.focus();
                });
            }
        }
    };
});