angular.module('DuckieTV.providers.kickasstorrents', [])
/**
 * Autofill serie search component
 * Provides autofill proxy and adds the selected serie back to the MainController
 */
.controller('FindKickassTypeAheadCtrl', function($scope, KickassTorrents) {

    $scope.selected = undefined;
    $scope.search = function(serie) {
        return KickassTorrents.search(serie).then(function(res) {
            return res;
        });
    };
    $scope.selectSerie = function(serie) {
        $scope.selected = serie.name;
        console.log("Serie selected!", serie);
    }
})
/**
 * KickassTorrents provider
 * Allows searching for any content on Kickass, ordered by most seeds
 */
.provider('KickassTorrents', function() {

    this.endpoints = {
        base: 'http://kickass.to',
        search: 'http://kickass.to/usearch/%s/?field=seeders&sorder=desc',
        details: 'http://kickasstorrents.se/torrent/%s',
    };

    /**
     * Switch between search and details
     */
    this.getUrl = function(type, param) {
        return this.endpoints[type].replace('%s', encodeURIComponent(param));
    },

    this.parseSearch = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var tables = doc.querySelectorAll('table.data');
        var results = tables.length == 1 ? tables[(tables.length == 1) ? 0 : 1].querySelectorAll('tr[id^=torrent]') : tables[1].querySelectorAll('tr[id^=torrent]');
        var output = [];
        for (var i = 0; i < results.length; i++) {
            if (!results[i].querySelector('a[title="Torrent magnet link"]')) continue;
            var out = {
                releasename: results[i].querySelector('div.torrentname a.cellMainLink').innerText,
                magneturl: results[i].querySelector('a[title="Torrent magnet link"]').href,
                size: results[i].querySelector('td:nth-child(2)').innerText,
                seeders: results[i].querySelector("td:nth-child(5)").innerHTML,
                leechers: results[i].querySelector("td:nth-child(6)").innerHTML,
                detailUrl: this.endpoints.base + results[i].querySelector('div.torrentname a.cellMainLink').getAttribute('href')
            };
            out.torrent = 'http://torcache.net/torrent/' + out.magneturl.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
            output.push(out);
        }
        return output;
    }

    /**
     * Get wrapper, providing the actual search functions and result parser
     * Provides promises so it can be used in typeahead as well as in the rest of the app
     */
    this.$get = function($q, $http) {
        var self = this;
        return {
            /**
             * Execute a generic Kickass search, parse the results and return them as an array
             */
            search: function(what) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('search', what),
                    cache: true
                }).then(function(response) {
                    console.log("Kickass search executed!", response);
                    d.resolve(self.parseSearch(response));
                }, function(err) {
                    console.log('error!');
                    d.reject(err);
                });
                return d.promise;
            },
            /**
             * Fetch details for a specific Kickass torrent id
             */
            torrentDetails: function(id) {
                var d = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('details', id),
                    cache: true
                }).success(function(response) {
                    d.resolve({
                        result: self.parseDetails(response)
                    });
                }).error(function(err) {
                    d.reject(err);
                });
                return d.promise;
            }
        }
    }
})
    .directive('kickassTorrentSearch', function() {

        return {
            restrict: 'E',
            template: ['<div ng-controller="FindKickassTypeAheadCtrl">',
                '<input type="text" ng-model="selected" placeholder="{{\'KICKASSTORRENTS_JS-placeholder-lbl\'|translate}}" typeahead-min-length="2" typeahead-loading="loadingKickass"',
                'typeahead="result for results in search($viewValue)" typeahead-template-url="templates/typeAheadKickass.html"',
                'typeahead-on-select="selectKickassItem($item)" class="form-control"> <i ng-show="loadingKickass" class="glyphicon glyphicon-refresh"></i>',
                '</div>'
            ].join(' ')
        };
    })
