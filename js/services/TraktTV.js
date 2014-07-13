angular.module('DuckieTV.providers.trakttv', ['DuckieTV.providers.settings'])
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

        this.getUrl = function(type, param, param2) {
            var out = this.endpoints[type].replace('%s', encodeURIComponent(param));
            console.log("Geturl: ", out, type);
            return (param2 !== undefined) ? out.replace('%s ', encodeURIComponent(param2)) : out;
        };

        this.getParser = function(type) {
            return type in this.parsers ? this.parsers[type] : function(data) {
                return data.data;
            };
        };

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
                enableBatchMode: function() {
                    self.batchmode = true;
                    return self.$get($q, $http);
                },
                disableBatchMode: function() {
                    self.batchmode = false;
                    return self.$get($q, $http);
                },
                findSeries: function(name) {
                    return self.promiseRequest('series', name);
                },
                findSerieByTVDBID: function(TVDB_ID) {
                    return self.promiseRequest('seriebyid', TVDB_ID);
                },
                findTrending: function() {
                    return self.promiseRequest('trending', '');
                },
                getUserShows: function(username) {
                    return self.promiseRequest('userShows', username);
                },
                getUserWatched: function(username) {
                    return self.promiseRequest('userWatched', username);
                },
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