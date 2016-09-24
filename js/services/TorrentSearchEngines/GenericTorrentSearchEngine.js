/**
 *  'Generic' torrent search engine scraper for environments where CORS is permitted. (Like node-webkit, chrome extension, phonegap, or when using a CORS proxy)
 *
 *  Usage:
 *      - Instantiate a new GenericTorrentSearchEngine and register it to the TorrentSearchEngines factory by creating a new app.run() block.
 *      - The search engine (SE) will automatically be added in the TorrentDialog directive and become available in settings for auto-selection.
 *      - Each SE should provide at least the properties described below (with the following exceptions):
 *        - the orderby group is optional, include it if you want to support sorting columns (and provider allows for it).
 *        - If the provider supplies magnets in the search page, then the detailsSelectors group is not required, but optional.
 *        - Where the magnet link and torrent hash are only on a details page, include the detailsSelectors group.
 *        - When magnets are not available, set noMagnet to true and provide a torrentUrl instead.
 *        - If noMagnets and the torrentUrl is only on the details page, then include the detailsSelectors group and set noDetailsMagnet to true.
 *
 *  Heavily annotated Example:
 *
 *  DuckieTV.run(["TorrentSearchEngines", "$q", "$http", "$injector", function(TorrentSearchEngines, $q, $http, $injector) {
 *
 *      TorrentSearchEngines.registerSearchEngine('ThePirateBay', new GenericTorrentSearchEngine({ // name, instance
 *          mirror: 'https://thepiratebay.cr',                              // base endpoint
 *          mirrorResolver: 'MirrorResolver',                               // Angular class to $inject fetching a mirror
 *          includeBaseURL: true,                                           // Prefix the base url (config.mirror) to detailUrl & torrentUrl
 *          noMagnet: false,                                                // If SE has no magnet links, you must specify a torrentUrl in the selectors group for downloading the .torrent
 *          noDetailsMagnet: false,                                         // If SE has no magnet links in the details, specify a torrentUrl in the detailsSelectors for the .torrent
 *          endpoints: {                                                    // endpoints for details and search calls. Needs to be GET
 *              search: '/search/%s/0/%o/0',                                // use %s to pass in the search query. if the SE supports sorting, use %o to pass in the orderBy parm.
 *              details: '%s',                                              // unused but required? TBD
 *          },
 *          selectors: {                                                    // CSS selectors to grab content from search page.
 *              resultContainer: '#searchResult tbody tr',                  // CSS selector to select repeating results.
 *              releasename: ['td:nth-child(2) > div', 'innerText',         // selector, element attribute, [parser function].
 *                  function(text) {
 *                      return text.trim();
 *                  }
 *              ],
 *              magnetUrl: ['td:nth-child(2) > a', 'href'],
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
 *              age: {d: '3', a: '4'},                                      // if the provider does not support sorting then leave the orderby group out.
 *              leechers: {d: '9', a: '10'},                                // d: descending, a: ascending
 *              seeders: {d: '99', a: '8'},                                 // Note: only these four have language translation support.
 *              size: {d: '5', a: '6'}
 *          },
 *          detailsSelectors: {                                             // CSS selectors to grab content from details page.
 *              detailsContainer: '#detailsframe',                          // CSS selector to select the details container.
 *              magnetUrl: ['div.download a', 'href']
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
     * Grab optional overridden url from settings.
     */
    function getUrl(type, param, sortParam) {
        if (('mirrorSettingsKey' in config) && config.mirror != SettingsService.get(config.mirrorSettingsKey)) {
            config.mirror = SettingsService.get(config.mirrorSettingsKey);
        }
        var url = config.mirror + config.endpoints[type];
        // does provider supports search sorting?
        var sortPart = (typeof sortParam !== 'undefined') ? sortParam.split('.') : [];
        if (typeof sortParam !== 'undefined' && 'orderby' in config && sortPart.length == 2 && sortPart[0] in config.orderby && sortPart[1] in config.orderby[sortPart[0]]) {
            url = url.replace('%o', config.orderby[sortPart[0]][sortPart[1]]);
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
            size = (typeof size !== 'undefined' && size !== null && size !== '') ? size : '0 MB';
            var sizeA = (size.replace(',','').split(/\s{1}/)); // size split into value and unit
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
            var seed = getPropertyForSelector(results[i], selectors.seeders);
            var leech = getPropertyForSelector(results[i], selectors.leechers);
            if (seed != null) {
                seed = seed.replace(',','');
            }
            if (leech != null) {
                leech = leech.replace(',','');
            }
            var out = {
                releasename: releasename,
                size: sizeToMB(getPropertyForSelector(results[i], selectors.size)),
                seeders: seed,
                leechers: leech,
                detailUrl: (config.includeBaseURL ? config.mirror : '') + getPropertyForSelector(results[i], selectors.detailUrl),
                noMagnet: false
            };
            if (config.noMagnet === true) {
                if (config.noDetailsMagnet === true) {
                    out.torrentUrl = (config.includeBaseURL ? config.mirror : '') + getPropertyForSelector(results[i], selectors.torrentUrl);
                    out.noMagnet = true;
                }
            } else {
                var magnet = getPropertyForSelector(results[i], selectors.magnetUrl);
                out.magnetUrl = magnet;
                var magnetHash = null;
                if (out.magnetUrl != null) {
                    magnetHash = out.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                }
                if (magnetHash && magnetHash.length) {
                    out.torrent = 'https://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                }
            }
            output.push(out);
        }
        return output;
    }

    /**
     * Generic details parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    function parseDetails(data, releaseName) {
        var output = {};
        if ('detailsSelectors' in config) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(data.data, "text/html");
            var selectors = config.detailsSelectors;
            var container = doc.querySelector(selectors.detailsContainer);
            function getPropertyForSelector(parentNode, propertyConfig) {
                var node = parentNode.querySelector(propertyConfig[0]);
                if (!node) return null;
                var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
                return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
            }

            if ('noDetailsMagnet' in config && config.noDetailsMagnet === true) {
                output.torrentUrl = (config.includeBaseURL ? config.mirror : '') + getPropertyForSelector(container, selectors.torrentUrl);
            } else {
                var magnet = getPropertyForSelector(container, selectors.magnetUrl);
                output.magnetUrl = magnet;
                var magnetHash = null;
                if (output.magnetUrl != null) {
                    magnetHash = output.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                }
                if (magnetHash && magnetHash.length) {
                    output.torrent = 'https://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(releaseName.trim());
                }
            }
        }
        return output;
    }

    this.cancelActiveRequest = function() {
        if(activeRequest) {
            activeRequest.resolve();
        }
    };

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
                        return self.search(what, undefined, orderBy);
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
            sortBy = 'seeders.d';
        }
        return $http({
            method: 'GET',
            url: getUrl('search', what, sortBy),
            cache: false,
            timeout: timeout.promise,
            cancel: timeout
        });
    };

    /**
     * Get SE details page with the supplied url
     * the supplied releaseName is used to build itorrents.org url
     * returns 
     * {
     *    magnetUrl: "magnet:?xt=urn:btih:<hash>",
     *    torrent: "https://itorrents.org/torrent/<hash>.torrent?title=<releaseName>"
     * }
     */
    this.getDetails = function(url, releaseName) {
        return $http({
            method: 'GET',
            url: url,
            cache: true
        }).then(function(response) {
            return parseDetails(response, releaseName);
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

    this.asObject = function() {
        return {
            mirror: this.config.mirror,
            noMagnet: this.config.magnetUrlSelector.length < 2, // hasMagnet,
            includeBaseURL: true, // this.model.includeBaseUrl,
            loginRequired: this.config.loginRequired,
            loginPage: this.config.loginPage,
            loginTestSelector: this.config.loginTestSelector,
            endpoints: {
                search: this.config.searchEndpoint,
                details: [this.config.detailUrlSelector, this.config.detailUrlProperty]
            },
            selectors: {
                resultContainer: this.config.searchResultsContainer,
                releasename: [this.config.releaseNameSelector, this.config.releaseNameProperty],
                magnetUrl: [this.config.magnetUrlSelector, this.config.magnetUrlProperty],
                torrentUrl: [this.config.torrentUrlSelector, this.config.torrentUrlProperty],
                size: [this.config.sizeSelector, this.config.sizeProperty],
                seeders: [this.config.seederSelector, this.config.seederProperty],
                leechers: [this.config.leecherSelector, this.config.leecherProperty],
                detailUrl: [this.config.detailUrlSelector, this.config.detailUrlProperty]
            }
        }
    }

}
