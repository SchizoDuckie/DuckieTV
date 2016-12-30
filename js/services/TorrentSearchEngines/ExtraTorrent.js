/** 
 * ExtraTorrent.cc custom Torrent API interfacing.
 * Scrapes the torrents list from ExtraTorrent after using AES decryption.
 * dependants: CryptoJS
 */
DuckieTV.factory('ExtraTorrent', ["$q", "$http", "$injector",
    function($q, $http, $injector) {

        var activeRequest = null;

        /**
         * crypto formatter as used by http://extratorrent.cc/scripts/main.js?221202:12
         */
        var CryptoJSAesJson = {
            stringify: function(a) {
                var j = {
                    ct: a.ciphertext.toString(CryptoJS.enc.Base64)
                };
                if (a.iv) {
                    j.iv = a.iv.toString();
                }
                if (a.salt) {
                    j.s = a.salt.toString();
                }
                return JSON.stringify(j);
            },
            parse: function(a) {
                var j = JSON.parse(a);
                var b = CryptoJS.lib.CipherParams.create({
                    ciphertext: CryptoJS.enc.Base64.parse(j.ct)
                });
                if (j.iv) {
                    b.iv = CryptoJS.enc.Hex.parse(j.iv);
                }
                if (j.s) {
                    b.salt = CryptoJS.enc.Hex.parse(j.s);
                }
                return b;
            }
        };

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
                //console.debug(propertyConfig[0],node);
                if (!node) return null;
                var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
                return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
            };

            var parser = new DOMParser();
            var doc = parser.parseFromString(result.data, "text/html");
            var selectors = service.config.cryptoSelectors;
            var encryptedData = null, secretData = null, secret = null;
            // process encrypted search results
            /* var results = doc.querySelectorAll(selectors.cryptoContainer); */
            var resultED = doc.querySelectorAll(selectors.cryptoDataContainer);
            encryptedData = getPropertyForSelector(resultED[0], selectors.cryptoData);
            if (encryptedData) {
                var resultSD = doc.querySelectorAll(selectors.cryptoSecretContainer);
                secretData = getPropertyForSelector(resultSD[0], selectors.cryptoSecret);
                if (secretData) {

                    /**
                     * Password generator
                     * adapted from http://extratorrent.cc/scripts/main.js?221202:9
                     */
/*
                    //  (as at 17-dec-2016)
                    var secret = secretData.match(/function\set\(\)\{var\sg=\'(\d+)\'/i);
                    if (secret) {
                        secret = secret[1];
                        //console.debug('secret', secret);
                        var salt = JSON.parse(encryptedData).s;
                        //console.debug('salt', salt);
                        var password = '';
                        for (var i = 1; i <= secret.length / 2; i++) {
                            password += salt[parseInt(secret.substr(2 * (i - 1), 2))];
                        };
                        //console.debug('password', password);
                        result.data = JSON.parse(CryptoJS.AES.decrypt(encryptedData, password, { format: CryptoJSAesJson }).toString(CryptoJS.enc.Utf8));
*/
                    // (as at 23-dec-2016)
                    var secret = secretData.match(/\/article\/(\d+)\//i);
                    if (secret) {
                        //console.debug('secret', secret);
                        var salt = JSON.parse(encryptedData).s;
                        //console.debug('salt', salt);
                        var password = salt[1] + '000' + secret[1] + salt[5];
                        //console.debug('password', password);
                        result.data = JSON.parse(CryptoJS.AES.decrypt(encryptedData, password, { format: CryptoJSAesJson }).toString(CryptoJS.enc.Utf8));
                    
                        //console.debug(result);
                    } else {
                        console.warn('secret not found', secretData);
                        return output;
                    }
                } else {
                    console.warn('secretData not found', resultSD);
                    return output;
                }
            } else {
                console.warn('encryptedData not found', resultED);
            };
            // process decrypted search results
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
                    detailUrl: (service.config.includeBaseURL ? service.config.mirror : '') + getPropertyForSelector(results[i], selectors.detailUrl),
                    noMagnet: false
                };
                if (service.config.noMagnet === true) {
                    if (service.config.noDetailsMagnet === true) {
                        out.torrentUrl = (service.config.includeBaseURL ? service.config.mirror : '') + getPropertyForSelector(results[i], selectors.torrentUrl);
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
                mirror: 'https://extratorrent.cc',
                mirrorResolver: null,
                includeBaseURL: true,
                endpoints: {
                    search: '/search/?search=%s&srt=%o',
                    details: '%s' /* unused but required? TBD */
                },
                noMagnet: false,
                selectors: {
                    resultContainer: 'table.tl tr[class^=tl]',
                    releasename: ['td.tli > a', 'innerText'],
                    size: ['td:nth-of-type(5)', 'innerText'],
                    seeders: ['td:nth-child(6)', 'innerText',
                        function(text) {
                            return (text.trim() == '---') ? null : text.trim();
                        }
                    ],
                    leechers: ['td:nth-child(7)', 'innerText',
                        function(text) {
                            return (text.trim() == '---') ? null : text.trim();
                        }
                    ],
                    magnetUrl: ['td a[title^="Magnet link"]', 'href'],
                    detailUrl: ['td.tli > a', 'href'],
                    torrentUrl: ['td a[title^="Download "]', 'href',
                        function(href) {
                            return href.replace('torrent_','');
                        }
                    ]
                },
                /* cryptoSelectors: { 17-dec-2016
                    cryptoContainer: 'table tr td[style="vertical-align:top; padding: 3px 5px 0 10px; width: 100%"]',
                    cryptoData: ['#e_content', 'innerText'],
                    cryptoSecret: ['script', 'text']
                }, */
                cryptoSelectors: {  /* 23-dec-2016 */
                    cryptoDataContainer: 'table tr td[style="vertical-align:top; padding: 3px 5px 0 10px; width: 100%"]',
                    cryptoData: ['#e_content', 'innerText'],
                    cryptoSecretContainer: 'table tr td[style^="vertical-align:top;"]',
                    cryptoSecret: ['div.blog_content ul.ten_articles li a', 'href']
                },
                orderby: {
                    age: {d: 'added&order=desc', a: 'added&order=asc'},
                    seeders: {d: 'seeds&order=desc', a: 'seeds&order=asc'},
                    leechers: {d: 'leechers&order=desc', a: 'leechers&order=asc'},
                    size: {d: 'size&order=desc', a: 'size&order=asc'}
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


.run(["TorrentSearchEngines", "SettingsService", "ExtraTorrent",
    function(TorrentSearchEngines, SettingsService, ExtraTorrent) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('ExtraTorrent', ExtraTorrent);
        }
    }
]);