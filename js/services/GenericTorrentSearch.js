angular.module('DuckieTV.providers.genericsearch', ['DuckieTV.providers.settings'])
/**
 * ThePirateBay provider
 * Allows searching for any content on tpb, ordered by most seeds
 */
.provider('GenericSearch', function() {

    this.mirror = null;
    this.config = {
        mirror: 'https://torrentz.eu'
        mirrorResolver: null,
        endpoints: {
            search: '/search?f=%s',
            details: '/%s',
        },
        selectors: {
            resultContainer: 'div.results dl',
            releasename: ['dt a', 'href'],
            magneturl: ['dt a', 'href',
                function(r) {
                    return r.substring(1);
                }
            ],
            size: [],
            seeders: [],
            leechers: [],
            detailUrl: [],
        }
    },

    /**
     * Switch between search and details
     */
    this.getUrl = function(type, param) {
        return this.mirror + this.endpoints[type].replace('%s', encodeURIComponent(param));
    },

    /**
     * Generic search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    this.parseSearch = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var config = this.config.selectors;
        var results = doc.querySelectorAll(config.resultContainer);
        var output = [],
        for (var i = 0; i < results.length; i++) {

            var magnet = results[i].querySelector(config.magneturl[0])[config.magneturl[1]];
            var releasename = results[i].querySelector(config.releasename[0])[config.releasename[1]];
            var size = results[i].querySelector(config.size[0])[config.size[1]],
            var seeders = results[i].querySelector(config.seeders[0])[config.seeders[1]],
            var leechers = results[i].querySelector(config.leechers[0])[config.leechers[1]],
            var detailUrl = this.mirror + results[i].querySelector(config.detailUrl[0])[config.detailUrl[1]],
            var out = {
                releasename: config.releasename.length == 3 ? config.releasename[3](releasename) : releasename,
                magneturl: config.magneturl.length == 3 ? config.magneturl[3](magnet) : magnet,
                size: config.size.length == 3 ? config.size[3](size) : size
                seeders: config.seeders.length == 3 ? config.seeders[3](seeders) : seeders
                leechers: config.leechers.length == 3 ? config.leechers[3](leechers) : leechers
                detailUrl: config.detailUrl.length == 3 ? config.detailUrl[3](detailUrl) : detailUrl
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
        self.mirror = SettingsService.get('thepiratebay.mirror');
        self.activeRequest = null;
        return {
            /**
             * Execute a generic tpb search, parse the results and return them as an array
             */
            search: function(what) {
                var d = $q.defer();
                if (self.activeRequest) self.activeRequest.resolve();
                self.activeRequest = $q.defer();
                $http({
                    method: 'GET',
                    url: self.getUrl('search', what),
                    cache: true,
                    timeout: self.activeRequest.promise
                }).then(function(response) {
                    //console.log("TPB search executed!", response);
                    d.resolve(self.parseSearch(response));
                }, function(err) {
                    if (err.status > 300) {
                        if (config.mirrorResolver) {
                            MirrorResolver.findirror().then(function(result) {
                                //console.log("Resolved a new working mirror!", result);
                                self.mirror = result;
                                return d.resolve(self.$get($q, $http, MirrorResolver).search(what));
                            }, function(err) {
                                //console.debug("Could not find a working TPB mirror!", err);
                                d.reject(err);
                            })
                        }
                    }
                });
                return d.promise;
            },
            /**
             * Fetch details for a specific torrent id
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