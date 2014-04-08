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
            seriebyidSearch: 'http://api.trakt.tv/show/summary.json/32e05d4138adb5da5b702b362bd21c52/%s/extended',
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

            seriebyid: function(data) {
                return data.data;
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
                findSeries: function(name) {
                    return self.promiseRequest('series', name);
                },
                findSerieByTVDBID: function(TVDB_ID) {
                    return self.promiseRequest('seriebyid', TVDB_ID);
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
        TraktTV.enableBatchMode().findSerieByTVDBID(serie.tvdb_id).then(function(serie) {
            FavoritesService.addFavorite(serie).then(function() {
                $rootScope.$broadcast('storage:update');
            });
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