/** 
 * Idope.se custom Torrent API interfacing.
 * Scrapes the torrents list from Idope.
 * Differs from GenericTorrentSearchEngine due to requirement to fetch detail and magnet urls from parent container rather than container children.
 */
DuckieTV.factory('Idope', ["$q", "$http", "$injector",
    function($q, $http, $injector) {

        var activeRequest = null;

        /**
         * Grab optional overridden url from settings.
         */
        var getUrl = function(type, param, sortParam) {
            var url = service.config.mirror + service.config.endpoints[type];
            // does provider support search sorting?
            var sortPart = (typeof sortParam !== 'undefined') ? sortParam.split('.') : [];
            if (typeof sortParam !== 'undefined' && 'orderby' in service.config && sortPart.length == 2 && sortPart[0] in service.config.orderby && sortPart[1] in service.config.orderby[sortPart[0]]) {
                url = url.replace('%o', service.config.orderby[sortPart[0]][sortPart[1]]);
            }
            return url.replace('%s', encodeURIComponent(param));
        };

        /**
         * Search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
         */
        var parseSearch = function(result) {
            var output = [];

            function getPropertyForSelector(parentNode, propertyConfig) {
                var node = parentNode.querySelector(propertyConfig[0]);
                //console.debug(parentNode,propertyConfig[0],node);
                if (!node) return null;
                var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
                return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
            };
            function getProperty(parentNode, propertyConfig) {
                var node = parentNode;
                if (!node) return null;
                var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
                return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
            };

            var parser = new DOMParser();
            var doc = parser.parseFromString(result.data, "text/html");
            var selectors = service.config.selectors;
            var results = doc.querySelectorAll(selectors.resultContainer);
            //console.debug('searchcontainer',results);

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
            };

            for (var i = 0; i < results.length; i++) {
                var releasename = getPropertyForSelector(results[i], selectors.releasename);
                if (releasename === null) continue;
                var seed = getPropertyForSelector(results[i], selectors.seeders);
                var leech = getPropertyForSelector(results[i], selectors.leechers);
                seed = (seed != null) ? seed.replace(',','') : 0;
                leech = (leech != null) ? leech.replace(',','') : 0;
                var out = {
                    releasename: releasename.trim(),
                    size: sizeToMB(getPropertyForSelector(results[i], selectors.size)),
                    seeders: seed,
                    leechers: leech,
                    detailUrl: (service.config.includeBaseURL ? service.config.mirror : '') + getProperty(results[i], selectors.detailUrl),
                    noMagnet: false
                };
                if (service.config.noMagnet === true) {
                    if (service.config.noDetailsMagnet === true) {
                        out.torrentUrl = (service.config.includeBaseURL ? service.config.mirror : '') + getProperty(results[i], selectors.torrentUrl);
                        out.noMagnet = true;
                    }
                } else {
                    var magnet = getProperty(results[i], selectors.magnetUrl);
                    out.magnetUrl = magnet;
                    var magnetHash = null;
                    if (out.magnetUrl != null) {
                        magnetHash = out.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                    }
                    if (magnetHash && magnetHash.length) {
                        out.torrent = 'http://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                    }
                }
                output.push(out);
            }
            //console.debug('parseSearch',output);
            return output;
        };

        var service = {
            config: {
                mirror: 'https://www.idope.se',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/torrent/%s/?&o=%o',
                    details: '%s'
                },
                selectors: {
                    resultContainer: 'a[href^="/torrent/"]',
                    releasename: ['div.resultdiv div.resultdivtop div.resultdivtopname', 'innerText'],
                    seeders: ['div.resultdiv div.resultdivbotton div.resultseed div.resultdivbottonseed', 'innerText'],
                    leechers:  ['div.resultdiv div.resultdivbotton div.resultseed div.resultdivbottonseed', 'innerText',
                        function(text) {
                            return 'n/a';
                        }
                    ],
                    size: ['div.resultdiv div.resultdivbotton div.resultlength div.resultdivbottonlength', 'innerText'],
                    detailUrl: ['','href'],
                    magnetUrl: ['','href',
                        function(href) {
                            var magnetHash = href.match(/([0-9ABCDEFabcdef]{40})/);
                            return  'magnet:?xt=urn:btih:' + magnetHash[0] + $injector.get('TorrentSearchEngines').trackers;
                        }
                    ]
                },
                orderby: {
                    age: {d: '-3', a: '3'},
                    seeders: {d: '-1', a: '1'},
                    size: {d: '-2', a: '2'}
                }
            },
            search: function(what, noCancel, orderBy) {
                noCancel = (noCancel == undefined) ? false : noCancel; 
                orderBy = (orderBy == undefined) ? 'seeders.d' : orderBy; 
                var d = $q.defer();
                if (noCancel !== true && activeRequest) {
                    activeRequest.resolve();
                }
                activeRequest = $q.defer();
                service.executeSearch(what, activeRequest, orderBy).then(function(response) {
                    //console.debug("Torrent search executed!", response);
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
                        } else if (service.config.mirrorResolver && service.config.mirrorResolver !== null) {
                            $injector.get(service.config.mirrorResolver).findMirror().then(function(result) {
                                //console.debug("Resolved a new working mirror!", result);
                                mirror = result;
                                return service.search(what, undefined, orderBy);
                            }, function(err) {
                                d.reject(err);
                            });
                        }
                    }
                });
                return d.promise;
            },
            executeSearch: function(what, timeout, sortBy) {
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
            },
            cancelActiveRequest: function() {
                if (activeRequest) {
                    activeRequest.resolve();
                }
            }
        };
        return service;
    }
])


.run(["TorrentSearchEngines", "SettingsService", "Idope",
    function(TorrentSearchEngines, SettingsService, Idope) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Idope', Idope);
        }
    }
]);