angular.module('DuckieTV.providers.generictorrentsearch', ['DuckieTV.providers.settings'])
/**
 * Generic Torrent Search provider
 * Allows searching for any content on a configurable torrent client
 */
.factory('GenericSearch', function(SettingsService, $q, $http) {

    var mirror = null;
    var activeRequest = null;
    var config = {
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
    function getUrl(type, param) {
        return mirror + config.endpoints[type].replace('%s', encodeURIComponent(param));
    };

    /**
     * Generic search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    function parseSearch(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var selectors = config.selectors;
        var results = doc.querySelectorAll(selectors.resultContainer);
        var output = [];

        function getPropertyForSelector(parentNode, propertyConfig) {
            var node = parentNode.querySelector(propertyConfig[0]);
            if (!node) return null;
            var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
            return propertyConfig.length == 3 ? propertyConfig[2](propertyValue) : propertyValue;
        }
        for (var i = 0; i < results.length; i++) {
            var magnet = getPropertyForSelector(results[i], selectors.magneturl);
            var releasename = getPropertyForSelector(results[i], selectors.releasename);
            if (releasename === null || (magnet === null && !selectors.detailUrlMagnet)) continue;
            var out = {
                magneturl: magnet,
                releasename: releasename,
                size: getPropertyForSelector(results[i], selectors.size),
                seeders: getPropertyForSelector(results[i], selectors.seeders),
                leechers: getPropertyForSelector(results[i], selectors.leechers),
                detailUrl: mirror + getPropertyForSelector(results[i], selectors.detailUrl)
            };
            var magnetHash = out.magneturl.match(/([0-9ABCDEFabcdef]{40})/);
            if (magnetHash && magnetHash.length) {
                out.torrent = 'http://torcache.gs/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                output.push(out);
            }
        }

        return output;
    };


    /**
     * Get wrapper, providing the actual search functions and result parser
     * Provides promises so it can be used in typeahead as well as in the rest of the app
     */
    var service = {
        getMirror: function() {
            return mirror;
        },
        setConfig: function(newConfig) {
            config = newConfig;
            mirror = newConfig.mirror;
        },
        getConfig: function() {
            return config;
        },
        getProviders: function() {
            return SettingsService.get('torrenting.genericClients');
        },
        setProvider: function(provider) {
            if ((provider in providers)) {
                service.setConfig(providers[provider]);
            }
        },
        /**
         * Execute a generic torrent search, parse the results and return them as an array
         */
        search: function(what, noCancel) {
            var d = $q.defer();
            if (noCancel !== true && activeRequest) {
                activeRequest.resolve();
            }
            activeRequest = $q.defer();
            $http({
                method: 'GET',
                url: getUrl('search', what),
                cache: true,
                timeout: activeRequest.promise
            }).then(function(response) {
                //console.log("Torrent search executed!", response);
                d.resolve(parseSearch(response));
            }, function(err) {
                if (err.status > 300) {
                    if (config.mirrorResolver && config.mirrorResolver !== null) {
                        $injector.get(config.mirrorResolver).findMirror().then(function(result) {
                            //console.log("Resolved a new working mirror!", result);
                            mirror = result;
                            return service.search(what);
                        }, function(err) {
                            d.reject(err);
                        });
                    }
                }
            });
            return d.promise;
        },
        /**
         * Fetch details for a specific torrent id
         */
        torrentDetails: function(id) {
            return $http({
                method: 'GET',
                url: self.getUrl('details', id),
                cache: true
            }).success(function(response) {
                return {
                    result: self.parseDetails(response)
                };
            });
        }
    };

    // auto-initialize 
    var providers = service.getProviders();
    if (!(SettingsService.get('torrenting.searchprovider') in providers)) {
        // autoconfig migration, fallback to first provider in the list when we detect an invalid provider.
        console.log("Invalid search provider detected: ", SettingsService.get('torrenting.searchprovider'), " defaulting to ", Object.keys(providers)[0]);
        SettingsService.set('torrenting.searchprovider', Object.keys(providers)[0]);
    }
    service.setProvider(SettingsService.get('torrenting.searchprovider'));
    return service;
});