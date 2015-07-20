/** 
 *  'Generic' torrent search engine scraper for environments where CORS is permitted. (Like node-webkit, chrome extension, phonegap, or when using a CORS proxy)
 *
 *   Usage:
 *   - Instantiate a new GenericTorrentSearchEngine and register it to the TorrentSearchEngines factory by creating a new app.run() block.
 *   - The engine will automatically be added in the TorrentDialog directive and become available in settings for autoselection.
 *   - Each search engine should provide at least the properties described below.
 *   - This is problematic in cases where the magnet link and torrent hash are hidden on a details page. (will be fixed in the future using the details field)
 *
 *   Heavily annotated Example:
 *
 *   DuckieTV.run(["TorrentSearchEngines", "$q", "$http", "$injector", function(TorrentSearchEngines, $q, $http, $injector) {
 *
 *       TorrentSearchEngines.registerSearchEngine('ThePirateBay', new GenericTorrentSearchEngine({ // name, instance
 *          mirror: 'https://thepiratebay.cr',                                                      // base endpoint
 *          mirrorResolver: 'MirrorResolver',                                                       // Angular class to $inject to fetch a mirror
 *          endpoints: {                                                                            // endpoints for details and search calls. Needs to be GET
 *              search: '/search/%s/0/7/0',                                                         // use %s to pass in the search query.
 *              details: '/torrent/%s'                                                              // unimplemented currently, but should fetch details from the torrent's details page.
 *          },
 *           selectors: {                                                                           // CSS selectors to grab content from search page.
 *              resultContainer: '#searchResult tbody tr',                                          // css selector to select repeating results.
 *              releasename: ['td:nth-child(2) > div', 'innerText',                                 // selector, element attribute, [parser function].
 *                  function(text) {
 *                      return text.trim();
 *                  }
 *              ],
 *              magneturl: ['td:nth-child(2) > a', 'href'],
 *              size: ['td:nth-child(2) .detDesc', 'innerText',
 *                  function(innerText) {
 *                      return innerText.split(', ')[1].split(' ')[1];
 *                  }
 *              ],
 *              seeders: ['td:nth-child(3)', 'innerHTML'],
 *              leechers: ['td:nth-child(4)', 'innerHTML'],
 *              detailUrl: ['a.detLink', 'href'],
 *          }
 *      }, $q, $http, $injector));
 *   }
 *  ]);
 */
function GenericTorrentSearchEngine(config, $q, $http, $injector) {

    var activeRequest = null;
    var SettingsService = $injector.get('SettingsService');

    this.config = config;

    /**
     * Switch between search and details.
     * Grab optional overridden url from settings.
     */
    function getUrl(type, param) {
        if (('mirrorSettingsKey' in config) && config.mirror != SettingsService.get(config.mirrorSettingsKey)) {
            config.mirror = SettingsService.get(config.mirrorSettingsKey);
        }
        return config.mirror + config.endpoints[type].replace('%s', encodeURIComponent(param));
    }

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
            return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
        }

        for (var i = 0; i < results.length; i++) {
            var releasename = getPropertyForSelector(results[i], selectors.releasename);
            if (releasename === null) continue;
            var out = {
                releasename: releasename,
                size: getPropertyForSelector(results[i], selectors.size),
                seeders: getPropertyForSelector(results[i], selectors.seeders),
                leechers: getPropertyForSelector(results[i], selectors.leechers),
                detailUrl: (config.includeBaseURL ? config.mirror : '') + getPropertyForSelector(results[i], selectors.detailUrl)
            };
            if (config.noMagnet === true) {
                out.torrentUrl = (config.includeBaseURL ? config.mirror : '') + getPropertyForSelector(results[i], selectors.torrentUrl);
                output.push(out);
            } else {
                var magnet = getPropertyForSelector(results[i], selectors.magneturl);
                out.magneturl = magnet;

                var magnetHash = out.magneturl.match(/([0-9ABCDEFabcdef]{40})/);
                if (magnetHash && magnetHash.length) {
                    out.torrent = 'http://torcache.gs/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                    output.push(out);
                }
            }
        }

        return output;
    }

    /**
     * Execute a generic torrent search, parse the results and return them as an array
     */
    this.search = function(what, noCancel) {
        what = what.replace(/\'/g, '');
        var d = $q.defer();
        if (noCancel !== true && activeRequest) {
            activeRequest.resolve();
        }
        activeRequest = $q.defer();
        this.executeSearch(what, activeRequest).then(function(response) {
            //console.log("Torrent search executed!", response);
            d.resolve(parseSearch(response));
        }, function(err) {
            if (err.status > 300) {
                if (err.status == 404) {
                    d.resolve([]);
                } else if (config.mirrorResolver && config.mirrorResolver !== null) {
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
    };

    this.executeSearch = function(what, timeout) {
        if (!timeout) {
            timeout = $q.defer();
        }
        return $http({
            method: 'GET',
            url: getUrl('search', what),
            cache: false,
            timeout: timeout.promise
        });
    };

    /**
     * Fetch details for a specific torrent id
     */
    this.torrentDetails = function(id) {
        return $http({
            method: 'GET',
            url: self.getUrl('details', id),
            cache: true
        }).success(function(response) {
            return {
                result: self.parseDetails(response)
            };
        });
    };

}