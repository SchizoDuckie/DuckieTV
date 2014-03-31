angular.module('DuckieTV.providers.trakttv', [])
    .provider('TraktTV', function() {
        this.http = null;
        this.promise = null;
        this.activeRequest = null;

        this.endpoints = {
            seriesSearch: 'http://api.trakt.tv/search/shows.json/32e05d4138adb5da5b702b362bd21c52?query=%s',
            seasonSearch: 'http://api.trakt.tv/show/seasons.json/32e05d4138adb5da5b702b362bd21c52/%s',
            episodeSearch: 'http://api.trakt.tv/show/season.json/32e05d4138adb5da5b702b362bd21c52/%s/%s'
        };

        this.parsers = {
            season: function(data) {
                return data.data;
            },

            episode: function(data) {
                console.log("Parsed episodes!", data.data);
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
            }
        };

        this.getUrl = function(type, param, param2) {
            var out = this.endpoints[type + 'Search'].replace('%s', encodeURIComponent(param));
            return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
        };

        this.getParser = function(type) {
            return this.parsers[type];
        }

        this.promiseRequest = function(type, param, param2, dontCancel) {
            if (this.activeRequest && (dontCancel !== true)) {
                console.log("Found realier request: aborting.'");
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
                findSeriesByID: function(TVDB_ID) {
                    var d = self.promise.defer();
                    self.promiseRequest('season', TVDB_ID).then(function(seasons) {
                        console.log("Found seasons from trak.tv!", seasons);
                        $q.all(seasons.map(function(season) {
                            return self.promiseRequest('episode', TVDB_ID, season.season);
                        })).then(function(result) {
                            console.log("All results came in!", result);
                            d.resolve(result);
                        });

                    });
                    return d.promise;
                },
                findSeries: function(name) {
                    return self.promiseRequest('series', name);
                },
                findEpisodes: function(TVDB_ID) {
                    var d = self.promise.defer();
                    self.promiseRequest('season', TVDB_ID, null, true).then(function(seasons) {
                        console.log("Found seasons from trak.tv!", seasons);
                        $q.all(seasons.map(function(season, idx) {
                            var d = $q.defer();
                            season.seasonnumber = season.number == '0' ? 0 : (seasons.length - idx + 1);

                            self.promiseRequest('episode', TVDB_ID, season.season, true).then(function(data) {
                                data.season = season;
                                d.resolve(data);
                            }, d.reject);

                            return d.promise;

                        })).then(function(result) {
                            console.log("All results came in!", result);
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
        return TraktTV.findSeries(serie).then(function(res) {
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
        scope: {
            'focuswatch': '=focusWatch'
        },

        template: ['<div ng-controller="FindSeriesTypeAheadCtrl">',
            '<input type="text" ng-focus="searchingForSerie" ng-model="selected" placeholder="Type a series name to add to your favorites"',
            'typeahead-min-length="3" typeahead-loading="loadingSeries"',
            'typeahead="serie for series in findSeries($viewValue) | filter:$viewValue" typeahead-template-url="templates/typeAheadSeries.html"',
            'typeahead-on-select="selectSerie($item)" class="form-control"> <i ng-show="loadingTPB" class="glyphicon glyphicon-refresh"></i>',
            '</div>'
        ].join(''),
        link: function($scope, element) {
            if ($scope.focuswatch) {
                $scope.$watch($scope.focuswatch, function() {
                    var el = element.find('input')[0];
                    setTimeout(function() {
                        el.focus()
                    }, 0);
                });
            }
        }
    };
})