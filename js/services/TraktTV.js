angular.module('DuckieTV.providers.trakttv', [])
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
            trending: 'http://api.trakt.tv/shows/trending.json/32e05d4138adb5da5b702b362bd21c52'
        };

        this.parsers = {
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
            var out = this.endpoints[type].replace('%s', encodeURIComponent(param));
            console.log("Geturl: ", out, type);
            return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
        };

        this.getParser = function(type) {
            return type in this.parsers ? this.parsers[type] : function(data) {
                return data.data
            };
        }

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
                },
                findTrending: function() {
                    return self.promiseRequest('trending', '');
                }
            }
        }
    })


/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindSeriesTypeAheadCtrl', function($scope, TraktTV, FavoritesService, $rootScope) {


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