angular.module('DuckieTV.providers.trakttv', [])
    .provider('TraktTV', function() {
        this.http = null;
        this.promise = null;
        this.activeRequest = null;
        this.batchmode = true;

        this.endpoints = {
            seriesSearch: 'http://api.trakt.tv/search/shows.json/32e05d4138adb5da5b702b362bd21c52?query=%s',
            seasonSearch: 'http://api.trakt.tv/show/seasons.json/32e05d4138adb5da5b702b362bd21c52/%s',
            episodeSearch: 'http://api.trakt.tv/show/season.json/32e05d4138adb5da5b702b362bd21c52/%s/%s',
            shownameSearch: 'http://trakt.tv/search/tvdb/?q=%s'
        };

        this.parsers = {
            season: function(data) {
                return data.data;
            },

            episode: function(data) {
                return data.data;
            },

            series: function(data) {
                data = data.data;
                for (var i = 0; i < data.length; i++) {
                    data[i].poster = ('images' in data[i] && 'poster' in data[i].images) ? data[i].images.poster : '';
                    data[i].banner = ('images' in data[i] && 'banner' in data[i].images) ? data[i].images.banner : '';
                    data[i].fanart = ('images' in data[i] && 'fanart' in data[i].images) ? data[i].images.fanart : '';
                }
                return {
                    series: data
                };
            },
            showname: function(data) {
                return angular.element(data.data).find('h2')[0].innerText
            }
        };

        this.getUrl = function(type, param, param2) {
            var out = this.endpoints[type + 'Search'].replace('%s', encodeURIComponent(param));
            return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
        };

        this.getParser = function(type) {
            return this.parsers[type];
        }

        this.promiseRequest = function(type, param, param2) {
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
                console.log('error fetching', type);
                d.reject(err);
            });
            return d.promise;
        }


        this.$get = function($q, $http) {
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
                findSeriesByID: function(TVDB_ID) {
                    var d = self.promise.defer();
                    self.promiseRequest('season', TVDB_ID).then(function(seasons) {
                        $q.all(seasons.map(function(season) {
                            return self.promiseRequest('episode', TVDB_ID, season.season);
                        })).then(function(result) {
                            d.resolve(result);
                        });

                    });
                    return d.promise;
                },
                findSeries: function(name) {
                    return self.promiseRequest('series', name);
                },
                findSerieByTVDBID: function(TVDB_ID) {
                    return self.promiseRequest('showname', TVDB_ID).then(function(showname) {
                        return self.$get($q, $http).findSeries(showname).then(function(hits) {
                            return hits.series.filter(function(serie) {
                                return serie.tvdb_id == TVDB_ID;
                            })[0];
                        });
                    })
                },
                findEpisodes: function(TVDB_ID) {
                    var d = self.promise.defer();
                    self.promiseRequest('season', TVDB_ID, null, true).then(function(seasons) {
                        $q.all(seasons.map(function(season, idx) {
                            var d = $q.defer();
                            season.seasonnumber = season.season;
                            self.promiseRequest('episode', TVDB_ID, season.season, true).then(function(data) {
                                var uniques = {};
                                data.map(function(el, idx) {
                                    var key = el.season + '_' + el.episode + '-' + el.title.toLowerCase();

                                    if (!(key in uniques)) {
                                        uniques[key] = el;
                                    } else {
                                        if (uniques[key] && uniques[key].first_aired == null && el.first_aired != null) {
                                            uniques[key] = el;
                                        }
                                    }
                                });
                                var out = [];
                                angular.forEach(uniques, function(el) {
                                    out.push(el);
                                });
                                out.season = season;
                                d.resolve(out);
                            }, d.reject);

                            return d.promise;

                        })).then(function(result) {
                            d.resolve(result);
                        });

                    });
                    return d.promise;
                }
            }
        }
    })


/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindSeriesTypeAheadCtrl', function($scope, TraktTV, FavoritesService, $rootScope) {

    $scope.selected = undefined;
    $scope.activeRequest = null;
    $scope.findSeries = function(serie) {
        return TraktTV.disableBatchMode().findSeries(serie).then(function(res) {
            TraktTV.enableBatchMode();
            return res.series;
        });
    };
    $scope.selectSerie = function(serie) {
        $scope.selected = serie.name;
        FavoritesService.addFavorite(serie).then(function() {
            $rootScope.$broadcast('storage:update');
        });
        $scope.selected = '';
    }
})

/**
 * <trakt-tv-search>
 */
.directive('traktTvSearch', function() {

    return {
        restrict: 'E',

        template: ['<div ng-controller="FindSeriesTypeAheadCtrl">',
            '<input type="text" ng-focus="searchingForSerie" ng-model="selected" placeholder="Type a series name to add to your favorites"',
            'typeahead-min-length="3" typeahead-wait-ms="400" typeahead-loading="loadingSeries"',
            'typeahead="serie for series in findSeries($viewValue) | filter:$viewValue" typeahead-template-url="templates/typeAheadSeries.html"',
            'typeahead-on-select="selectSerie($item)" class="form-control"> <i ng-show="loadingSeries" class="glyphicon glyphicon-refresh"></i>',
            '</div>'
        ].join(''),
        link: function($scope, element) {

        }
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
                    el.focus()
                });
            }
        }
    };
})