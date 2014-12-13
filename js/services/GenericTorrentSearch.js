angular.module('DuckieTV.providers.generictorrentsearch', ['DuckieTV.providers.settings'])
/**
 * Generic Torrent Search provider
 * Allows searching for any content on a configurable torrent client
 */
.provider('GenericSearch', function() {

    this.mirror = null;
    this.config = {
        mirror: 'https://torrentz.eu',
        mirrorResolver: null,
        endpoints: {
            search: '/search?f=%s',
            details: '/%s',
        },
        selectors: {
            resultContainer: 'div.results dl',
            releasename: ['dt a', 'innerHTML'],
            magneturl: ['dt a', 'attributes',
                function(a) {
                    return 'magnet:?xt=urn:sha1:' + a.substring(1);
                }
            ],
            size: ['dd span.s', 'innerText'],
            seeders: ['dd span.u', 'innerText'],
            leechers: ['dd span.d', 'innerText'],
            detailUrl: ['dt a', 'href']
        }
    };


    /**
     * Switch between search and details
     */
    this.getUrl = function(type, param) {
        return this.mirror + this.config.endpoints[type].replace('%s', encodeURIComponent(param));
    };

    /**
     * Generic search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    this.parseSearch = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var config = this.config.selectors;
        var results = doc.querySelectorAll(config.resultContainer);
        var output = [];

        function getPropertyForSelector(parentNode, propertyConfig) {
            var node = parentNode.querySelector(propertyConfig[0]);
            if (!node) return null;
            var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
            return propertyConfig.length == 3 ? propertyConfig[2](propertyValue) : propertyValue;
        }
        for (var i = 0; i < results.length; i++) {
            var magnet = getPropertyForSelector(results[i], config.magneturl);
            var releasename = getPropertyForSelector(results[i], config.releasename);
            if (releasename === null || (magnet === null && !config.detailUrlMagnet)) continue;
            var out = {
                magneturl: magnet,
                releasename: releasename,
                size: getPropertyForSelector(results[i], config.size),
                seeders: getPropertyForSelector(results[i], config.seeders),
                leechers: getPropertyForSelector(results[i], config.leechers),
                detailUrl: this.mirror + getPropertyForSelector(results[i], config.detailUrl)
            };
            var magnetHash = out.magneturl.match(/([0-9ABCDEFabcdef]{40})/);
            if (magnetHash && magnetHash.length) {
                out.torrent = 'http://torcache.net/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                output.push(out);
            }
        }

        return output;
    };

    /**
     * Get wrapper, providing the actual search functions and result parser
     * Provides promises so it can be used in typeahead as well as in the rest of the app
     */
    this.$get = function($q, $http, MirrorResolver, SettingsService) {
        var self = this;
        self.mirror = this.config.mirror;
        self.activeRequest = null;
        return {
            setConfig: function(config) {
                self.config = config;
                self.mirror = config.mirror;
            },
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
                        if (self.config.mirrorResolver && self.config.mirrorResolver != null) {
                            $injector.get(self.config.mirrorResolver).findMirror().then(function(result) {
                                //console.log("Resolved a new working mirror!", result);
                                self.mirror = result;
                                return d.resolve(self.$get($q, $http, $injector.get(self.config.mirrorResolver)).search(what));
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