/** 
 *  'Generic' torrent search engine scraper for environments where CORS is permitted. (Like node-webkit, chrome extension, phonegap, or when using a CORS proxy)
 *
 *  Usage:
 *      - Instantiate a new GenericTorrentSearchEngine and register it to the TorrentSearchEngines factory by creating a new app.run() block.
 *      - The engine will automatically be added in the TorrentDialog directive and become available in settings for auto-selection.
 *      - Each search engine should provide at least the properties described below.
 *      - This is problematic in cases where the magnet link and torrent hash are hidden on a details page. (will be fixed in the future using the details field)
 *
 *  Heavily annotated Example:
 *
 *  DuckieTV.run(["TorrentSearchEngines", "$q", "$http", "$injector", function(TorrentSearchEngines, $q, $http, $injector) {
 *
 *      TorrentSearchEngines.registerSearchEngine('ThePirateBay', new GenericTorrentSearchEngine({ // name, instance
 *          mirror: 'https://thepiratebay.cr',                              // base endpoint
 *          mirrorResolver: 'MirrorResolver',                               // Angular class to $inject to fetch a mirror
 *          endpoints: {                                                    // endpoints for details and search calls. Needs to be GET
 *              search: '/search/%s/0/%o/0',                                // use %s to pass in the search query. if the provider supports sorting, use %o to pass in the search orderBy parm.
 *              details: '/torrent/%s'                                      // unimplemented currently, but should fetch details from the torrent's details page.
 *          },
 *          selectors: {                                                    // CSS selectors to grab content from search page.
 *              resultContainer: '#searchResult tbody tr',                  // CSS selector to select repeating results.
 *              releasename: ['td:nth-child(2) > div', 'innerText',         // selector, element attribute, [parser function].
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
 *          },
 *          orderby: {                                                      // search-order sorting options.
 *              age: '3',                                                   // if the provider does not support sorting then leave the orderby group out.
 *              leechers: '9',                                              // list only orderBy params that the provider supports for Desc sorting. 
 *              seeders: '7',                                               // Asc sorting is currently not supported.
 *              size: '5'                                                   // Note: only these four have language translation support.
 *          }
 *      }, $q, $http, $injector));
 *  }]);
 */
function GenericTorrentSearchEngine(config, $q, $http, $injector) {

    var self = this;

    var activeRequest = null;
    var SettingsService = $injector.get('SettingsService');

    this.config = config;

    /**
     * Switch between search and details.
     * Grab optional overridden url from settings.
     */
    function getUrl(type, param, sortParam) {
        if (('mirrorSettingsKey' in config) && config.mirror != SettingsService.get(config.mirrorSettingsKey)) {
            config.mirror = SettingsService.get(config.mirrorSettingsKey);
        }
        var url = config.mirror + config.endpoints[type];
        // does provider supports search sorting?
        if (typeof sortParam !== 'undefined' && 'orderby' in config && sortParam in config.orderby) {
            url = url.replace('%o', config.orderby[sortParam]);
        }
        return url.replace('%s', encodeURIComponent(param));        
    }

    /**
     * Generic search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    function parseSearch(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var selectors = config.selectors;
        if ('loginRequired' in config && config.loginRequired) {
            var loginTest = doc.querySelectorAll(config.loginTestSelector);
            if (loginTest.length > 0) {
                if (confirm("Not logged in @ " + config.mirror + '. Do you want to open a new window so that you can login?')) {
                    window.open(config.mirror + config.loginPage);
                }
                throw "Not logged in!";
            }
        }
        var results = doc.querySelectorAll(selectors.resultContainer);
        var output = [];

        function getPropertyForSelector(parentNode, propertyConfig) {
            var node = parentNode.querySelector(propertyConfig[0]);
            if (!node) return null;
            var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
            return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
        }

        function sizeToMB(size) {
            size = (typeof size !== 'undefined' && size !== null) ? size : '0 MB';
            var sizeA = size.split(/\s{1}/); // size split into value and unit
            var newSize = null; // size converted to MB
            switch (sizeA[1].toUpperCase()) {
                case 'B':
                case 'BYTES':
                    newSize = (parseFloat(sizeA[0]) / 1000 / 1000).toFixed(2);
                    break;
                case 'KB':
                    newSize = (parseFloat(sizeA[0]) / 1000).toFixed(2);
                    break;
                case 'MB':
                    newSize = (parseFloat(sizeA[0])).toFixed(2);
                    break;
                case 'GB':
                    newSize = (parseFloat(sizeA[0]) * 1000).toFixed(2);
                    break;
                case 'TB':
                    newSize = (parseFloat(sizeA[0]) * 1000 * 1000).toFixed(2);
                    break;
                case 'KIB':
                    newSize = ((parseFloat(sizeA[0]) * 1024) / 1000 / 1000).toFixed(2);
                    break;
                case 'MIB':
                    newSize = ((parseFloat(sizeA[0]) * 1024 * 1024) / 1000 / 1000).toFixed(2);
                    break;
                case 'GIB':
                    newSize = ((parseFloat(sizeA[0]) * 1024 * 1024 * 1024) / 1000 / 1000).toFixed(2);
                    break;
                case 'TIB':
                    newSize = ((parseFloat(sizeA[0]) * 1024 * 1024 * 1024 * 1024) / 1000 / 1000).toFixed(2);
                    break;
                default:
                    return size;
            }
            return newSize + ' MB';
        }

        for (var i = 0; i < results.length; i++) {
            var releasename = getPropertyForSelector(results[i], selectors.releasename);
            if (releasename === null) continue;
            var out = {
                releasename: releasename,
                size: sizeToMB(getPropertyForSelector(results[i], selectors.size)),
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
                var magnetHash = null;
                if (out.magneturl != null) {
                    magnetHash = out.magneturl.match(/([0-9ABCDEFabcdef]{40})/);
                }
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
    this.search = function(what, noCancel, orderBy) {
        what = what.replace(/\'/g, '');
        var d = $q.defer();
        if (noCancel !== true && activeRequest) {
            activeRequest.resolve();
        }
        activeRequest = $q.defer();
        this.executeSearch(what, activeRequest, orderBy).then(function(response) {
            //console.log("Torrent search executed!", response);
            try {
                var result = parseSearch(response);
                d.resolve(result);
            } catch (E) {
                d.reject(E);
            }
        }, function(err) {
            if (err.status > 300) {
                if (err.status == 404) {
                    d.resolve([]);
                } else if (config.mirrorResolver && config.mirrorResolver !== null) {
                    $injector.get(config.mirrorResolver).findMirror().then(function(result) {
                        //console.log("Resolved a new working mirror!", result);
                        mirror = result;
                        return self.search(what, undefined ,orderBy);
                    }, function(err) {
                        d.reject(err);
                    });
                }
            }
        });
        return d.promise;
    };

    this.executeSearch = function(what, timeout, sortBy) {
        if (!timeout) {
            timeout = $q.defer();
        }
        if (!sortBy) {
            sortBy = 'seeders';
        }
        return $http({
            method: 'GET',
            url: getUrl('search', what, sortBy),
            cache: false,
            timeout: timeout.promise
        });
    };

    /**
     * Fetch details for a specific torrent id
     * CURRENTLY UNUSED (referenced by js/services/IMDB.js and  js/services/IGoogleImages.js)
     */
    this.torrentDetails = function(id) {
        return $http({
            method: 'GET',
            url: self.getUrl('details', id),
            cache: true
        }).then(function(response) {
            return {
                result: self.parseDetails(response.data)
            };
        });
    };

}
