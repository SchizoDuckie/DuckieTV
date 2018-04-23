/**
 *  'Generic' torrent search engine scraper for environments where CORS is permitted. (Like node-webkit, chrome extension, phonegap, or when using a CORS proxy)
 *
 *  Usage:
 *      - Instantiate a new GenericTorrentSearchEngine and register it to the TorrentSearchEngines factory by creating a new app.run() block.
 *      - The search engine (SE) will automatically be added in the TorrentDialog directive and become available in settings for auto-selection.
 *      - Each SE should provide at least the properties described below (with the following exceptions):
 *        - the orderby group is optional, include it if you want to support sorting columns (and provider allows for it).
 *        - If the provider supplies magnets in the search page, then the detailsSelectors group is not required, but optional.
 *        - Where the magnet link and/or torrent link are only on a details page, include the detailsSelectors group.
 *
 *  Heavily annotated Example:
 *
 *  DuckieTV.run(["TorrentSearchEngines", "$q", "$http", "$injector", function(TorrentSearchEngines, $q, $http, $injector) {
 *
 *      TorrentSearchEngines.registerSearchEngine('ThePirateBay', new GenericTorrentSearchEngine({ // name, instance
 *          mirror: 'https://thepiratebay.org',                             // base endpoint
 *          mirrorResolver: 'MirrorResolver',                               // Angular class to $inject fetching a mirror
 *          includeBaseURL: true,                                           // Prefix the base url (config.mirror) to detailUrl & torrentUrl
 *          endpoints: {                                                    // endpoints for details and search calls. Needs to be GET
 *              search: '/search/%s/0/%o/0'                                 // use %s to pass in the search query. if the SE supports sorting, use %o to pass in the orderBy parm.
 *          },
 *          selectors: {                                                    // CSS selectors to grab content from search page.
 *              resultContainer: '#searchResult tbody tr',                  // CSS selector to select repeating results.
 *              releasename: ['td:nth-child(2) > div', 'innerText'],        // selector, element attribute, [parser function].
 *              magnetUrl: ['td:nth-child(2) > a', 'href'],                 // if no magnet, leave it out
 *              torrentUrl: ['td:nth-child(2) > a', 'href'],                // if no torrent, leave it out
 *                                                                          // note: if neither, then one or both _must_ be in detailsSelectors
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
 *              leechers: {d: '9', a: '10'},                                // if the provider does not support sorting then leave the orderby group out.
 *              seeders: {d: '99', a: '8'},                                 // d: descending, a: ascending
 *              size: {d: '5', a: '6'}                                      // Note: only these three have language translation support.
 *          },
 *          detailsSelectors: {                                             // CSS selectors to grab content from details page.
 *                                                                          Required if magnet/torrent is not in search selectors
 *              detailsContainer: '#detailsframe',                          // CSS selector to select the details container.
 *              magnetUrl: ['div.download a', 'href'],                      // if no magnet, leave it out
 *              torrentUrl: ['div.download a', 'href']                      // if no torrent, leave it out
 *          }
 *      }, $q, $http, $injector));
 *  }]);
 */


function GenericTorrentSearchEngine(config, $q, $http, $injector) { // eslint-disable-line
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

    function getPropertyForSelector(parentNode, propertyConfig) {
        if (!propertyConfig || !propertyConfig.length || propertyConfig.length < 2) return null;
        var node;
        if (propertyConfig[0] === '') {
            node = parentNode;
        } else {
            node = parentNode.querySelector(propertyConfig[0]);
        }
        //console.debug('search',parentNode,propertyConfig[0],node);
        if (!node) return null;
        var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
        return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
    }

    /**
     * Generic search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    function parseSearch(result) {
        var output = [];

        if ('isJackett' in config && config.isJackett) {
            // this is a jackett Search Engine
            if (config.useTorznab) {
                // jackett via torznab returns xml 
                var x2js = new X2JS({arrayAccessForm : "property"});
                var jsonObj = x2js.xml2json((new DOMParser()).parseFromString(result.data, "text/xml"));
                if ('rss' in jsonObj && 'channel' in jsonObj.rss && 'item' in jsonObj.rss.channel) {
                    //console.debug(config.name,jsonObj.rss.channel.item_asArray);
                    jsonObj.rss.channel.item_asArray.map(function(data) {
                        var seeds = null,
                            peers = null;
                        data.attr_asArray.map(function(attr) {
                            if (attr._name === 'seeders') {
                                seeds = attr._value;
                            }
                            if (attr._name === 'peers') {
                                peers = attr._value;
                            }
                        });
                        var out = {
                            releasename: data.title,
                            size: (parseFloat(data.size) / 1000 / 1000).toFixed(2) + ' MB',
                            seeders: (seeds != null) ? seeds : 'n/a',
                            leechers: (peers != null) ? peers : 'n/a',
                            detailUrl: data.guid,
                            noMagnet: true,
                            noTorrent: true
                        };
                        var magnet = null;
                        if (data.link.indexOf('magnet:?') === 0) {
                            magnet = data.link;
                        }
                        var magnetHash = null;
                        if (magnet) {
                            out.magnetUrl = magnet;
                            out.noMagnet = false;
                            magnetHash = out.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                        }
                        var torrent = null;
                        if (data.link.indexOf('http') === 0) {
                            torrent = data.link;
                        }
                        if (torrent) {
                            out.torrentUrl = torrent;
                            out.noTorrent = false;
                        } else if (magnetHash && magnetHash.length) {
                            out.torrentUrl = 'http://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                            out.noTorrent = false;
                        }
                        output.push(out);
                    });
                }
            } else {
                // jackett via Admin/search returns json
                if ('Results' in result.data && result.data.Results !== output) {
                    //console.debug(config.name,result.data.Results);
                    result.data.Results.map(function(data) {
                        var out = {
                            releasename: data.Title,
                            size: (parseFloat(data.Size) / 1000 / 1000).toFixed(2) + ' MB',
                            seeders: (data.Seeders != null) ? data.Seeders : 'n/a',
                            leechers: (data.Peers != null) ? data.Peers : 'n/a',
                            detailUrl: data.Guid,
                            noMagnet: true,
                            noTorrent: true
                        };
                        var magnet = data.MagnetUri;
                        var magnetHash = null;
                        if (magnet) {
                            out.magnetUrl = magnet;
                            out.noMagnet = false;
                            magnetHash = out.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                        }
                        var torrent = data.Link;
                        if (torrent) {
                            out.torrentUrl = torrent;
                            out.noTorrent = false;
                        } else if (magnetHash && magnetHash.length) {
                            out.torrentUrl = 'http://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                            out.noTorrent = false;
                        }
                        output.push(out);
                    });
                }
            }
            //console.debug(config.name,output);
            return output;
        } else {
            // this is a standard (or custom) Search Engine
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
            //console.debug('searchcontainer',selectors.resultContainer,results);

            for (var i = 0; i < results.length; i++) {
                var releasename = getPropertyForSelector(results[i], selectors.releasename);
                if (releasename === null) continue;

                var seed = getPropertyForSelector(results[i], selectors.seeders);
                var leech = getPropertyForSelector(results[i], selectors.leechers);
                seed = (seed != null) ? seed.replace(',', '') : 'n/a';
                leech = (leech != null) ? leech.replace(',', '') : 'n/a';

                var out = {
                    releasename: releasename.trim(),
                    size: sizeToMB(getPropertyForSelector(results[i], selectors.size)),
                    seeders: seed,
                    leechers: leech,
                    detailUrl: (config.includeBaseURL ? config.mirror : '') + getPropertyForSelector(results[i], selectors.detailUrl),
                    noMagnet: true,
                    noTorrent: true
                };

                var magnet = getPropertyForSelector(results[i], selectors.magnetUrl);
                var torrent = getPropertyForSelector(results[i], selectors.torrentUrl);
                var magnetHash = null;

                if (magnet) {
                    out.magnetUrl = magnet;
                    out.noMagnet = false;
                    magnetHash = out.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                }

                if (torrent) {
                    out.torrentUrl = (torrent.startsWith('http')) ? torrent : config.mirror + torrent;
                    out.noTorrent = false;
                } else if (magnetHash && magnetHash.length) {
                    out.torrentUrl = 'http://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                    out.noTorrent = false;
                }

                // if there is no magnet and/or no torrent, check of detailsSelectors has been provided.
                if ('detailsSelectors' in config) {
                    if ('magnetUrl' in config.detailsSelectors) {
                        out.noMagnet = false;
                    }
                    if ('torrentUrl' in config.detailsSelectors) {
                        out.noTorrent = false;
                    }
                }

                output.push(out);
            }

            //console.debug('parseSearch',config.mirror, output);
            return output;
        }
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
            //console.debug('detailscontainer',container)
            var magnet = getPropertyForSelector(container, selectors.magnetUrl);
            var magnetHash = null;
            if (magnet) {
                output.magnetUrl = magnet;
                magnetHash = output.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
            }
            var torrent = getPropertyForSelector(container, selectors.torrentUrl);
            if (torrent) {
                output.torrentUrl = (torrent.startsWith('http')) ? torrent : config.mirror + torrent;
            } else if (magnetHash && magnetHash.length) {
                output.torrentUrl = 'http://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(releaseName.trim());
            }
        }
        //console.debug('parseDetails', config.mirror, output);
        return output;
    }

    this.cancelActiveRequest = function() {
        if (activeRequest) {
            activeRequest.resolve();
        }
    };

    /**
     * Execute a generic torrent search, parse the results and return them as an array
     */
    this.search = function(what, noCancel, orderBy) {
        what = what.replace(/'/g, '');
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
                        config.mirror = result;
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
        var payload;
        if (!timeout) {
            timeout = $q.defer();
        }

        if ('isJackett' in config && config.isJackett) {
            // this is a jackett Search Engine
            if (config.useTorznab) {
                // jacket via torznab
                if (('apiVersion' in config && config.apiVersion == 1) || !('apiVersion' in config)) {
                    // api 1
                    payload =  what.trim().replace(/\s/g, '+');
                } else {
                    // api 2
                    payload = '?t=search&cat=&apikey=' + config.apiKey + '&q=' + what.trim().replace(/\s/g, '+');                    
                }                
                return $http({
                    method: 'GET',
                    url: config.torznab + payload,
                    cache: false,
                    timeout: timeout.promise,
                    cancel: timeout
                });            
            } else {
                // jackett via Admin/search
                if (('apiVersion' in config && config.apiVersion == 1) || !('apiVersion' in config)) {
                    // api 1
                    payload =  'Query=' + what.trim().replace(/\s/g, '+') + '&Category=&Tracker=' + config.tracker;
                    return $http.post(config.mirror, payload, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                            'cache': false,
                            'timeout': timeout.promise,
                            'cancel': timeout
                        }
                    });
                } else {
                    // api 2 (0.8.136.0)
                    var trackerid = (config.tracker == 'all') ? '' : '&Tracker%5B%5D=' + config.tracker;
                    payload =  '?apikey=' + config.apiKey + '&Query=' + what.trim().replace(/\s/g, '%20') + trackerid;
                    return $http({
                        method: 'GET',
                        url: config.mirror + payload,
                        cache: false,
                        timeout: timeout.promise,
                        cancel: timeout
                    });            
                }
            }
        } else {
            // this is a standard Search Engine
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
        }
    };

    /**
     * Get SE details page with the supplied url
     * the supplied releaseName is used to build itorrents.org url
     * returns
     * {
     *    magnetUrl: "magnet:?xt=urn:btih:<hash>", // if available
     *    torrentUrl: "<torrentlink>", // if available
     *    torrentUrl: "http://itorrents.org/torrent/<hash>.torrent?title=<releaseName>" // if no torrent but has magnet
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

    function sizeToMB(size) {
        size = (typeof size !== 'undefined' && size !== null && size !== '') ? size.replace(',', '').match(/[0-9.]{1,}[\W]{0,}[KTMGmgibBytes]{2,}/)[0] : '0 MB';
        var sizeA = (size.replace(',', '').split(/\s{1}/)); // size split into value and unit
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
}