angular.module('DuckieTV.providers.kickasstorrents', [])
/**
 * KickassTorrents provider
 * Allows searching for any content on Kickass, ordered by most seeds
 */
.provider('KickassTorrents', function() {

    this.endpoints = {
        search: '/usearch/%s/?field=seeders&sorder=desc',
        details: '/torrent/%s',
    };
    this.mirror = null;

    /**
     * Switch between search and details
     */
    this.getUrl = function(type, param) {
        // strip last char of the mirror. kat fails if there's an extra slash.
        if(this.mirror[this.mirror.length -1] == '/') {
            this.mirror = this.mirror.substring(0, this.mirror.length -1);
        }
        return this.mirror + this.endpoints[type].replace('%s', encodeURIComponent(param));
    },

        /** 
     * Pass the http result data into a DOM document and execute query selectors on it
     * to transform the HTML into a JSON object of torrent info.
     */
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
                detailUrl: this.mirror + results[i].querySelector('div.torrentname a.cellMainLink').getAttribute('href')
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
    this.$get = function($q, $http, MirrorResolver, SettingsService) {
        var self = this;
        self.mirror = SettingsService.get('kickasstorrents.mirror');
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
                    //console.debug("KickAss search executed!", response);
                    if (response.status == 404) {
                        // search returned 'not found'
                        d.reject(response.status);
                    } else {
                        d.resolve(self.parseSearch(response));
                    };
                },  function(err) {
                    if (err.status >= 300) {
                        MirrorResolver.findKATMirror().then(function(result) {
                            //console.log("Resolved a new working mirror!", result);
                            self.mirror = result;
                            return d.resolve(self.$get($q, $http, MirrorResolver).search(what));
                        }, function(err) {
                            //console.debug("Could not find a working KAT mirror!", err);
                            d.reject(err);
                        })
                    }
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
                '<input type="text" ng-model="selected" placeholder="{{"KICKASSTORRENTSjs/placeholder"|translate}}" typeahead-min-length="2" typeahead-loading="loadingKickass"',
                'typeahead="result for results in search($viewValue)" typeahead-template-url="templates/typeAheadKickass.html"',
                'typeahead-on-select="selectKickassItem($item)" class="form-control"> <i ng-show="loadingKickass" class="glyphicon glyphicon-refresh"></i>',
                '</div>'
            ].join(' ')
        };
    })
