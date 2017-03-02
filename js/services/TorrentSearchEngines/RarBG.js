/** 
 * RARBG.com API interface via torrentapi.org..
 * Fetches list of torrent results and tries to fetch the magnet links for an episode.
 * docs: http://torrentapi.org/apidocs_v2.txt
 * error codes: https://github.com/rarbg/torrentapi/issues/1#issuecomment-114763312
 */
DuckieTV.factory('RarBG', ["$q", "$http",
    function($q, $http) {

        var activeSearchRequest = false,
            activeTokenRequest = false,
            endpoint = 'https://torrentapi.org/pubapi_v2.php?app_id=DuckieTV&';

        var endpoints = {
            search: 'token=%s&mode=search&search_string=%s&sort=%o&limit=25&format=json_extended',
            token: 'get_token=get_token&format=json_extended'
        };

        var getUrl = function(type, param, param2, param3) {
            var out = endpoint + endpoints[type].replace('%s', escape(param));
            out = (param2 !== undefined) ? out.replace('%s', escape(param2)) : out;
            if  (param3 !== undefined) {
                var sortPart = param3.split('.');
                return out.replace('%o', escape(service.config.orderby[sortPart[0]][sortPart[1]]));         
            } else {
                return out;
            }
        };

        var parsers = {
            search: function(result) {
                var output = [];
                if (result.data.error_code) {
                    switch (result.data.error_code) {
                        case 20: // No results found
                            return [];
                            break;
                        case 4: // Invalid token. Use get_token for a new one!
                            return 4;
                            break;
                        case 5: // Too many requests per second. Maximum requests allowed are 1req/2sec Please try again later!
                            console.warn('Error [%s], Reason [%s]', result.data.error_code, result.data.error);
                            return 5;
                            break;
                        default:
                            console.warn('Error [%s], Reason [%s]', result.data.error_code, result.data.error);
                            return [];
                    };
                };
                result.data.torrent_results.map(function(hit) {
                    var out = {
                        magnetUrl: hit.download,
                        noMagnet: false,
                        noTorrent: true,
                        releasename: hit.title,
                        size: (hit.size / 1024 / 1024).toFixed(2) + " MB",
                        seeders: hit.seeders,
                        leechers: hit.leechers,
                        detailUrl: hit.info_page
                    };

                    var magnetHash = out.magnetUrl.match(/([0-9ABCDEFabcdef]{40})/);
                    if (magnetHash && magnetHash.length) {
                        out.torrentUrl = 'http://itorrents.org/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                        out.noTorrent = false;
                        output.push(out);
                    }
                });
                return output;
            },

            token: function(result) {
                return result.data;
            }

        };

        /** 
         * Promise requests with built in delay to avoid the RarBG API's 1req/2sec frequency limit
         */
        var nextRequest = new Date().getTime();

        var promiseRequest = function(type, param, param2, param3, promise) {
            var url = getUrl(type, param, param2, param3);
            return $q(function(resolve, reject) {
                var timeout = (type === 'token') ? 0 : 2100;
                nextRequest = nextRequest + timeout;
                setTimeout(function() {
                    $http.get(url, {
                        timeout: promise ? promise : 120000,
                        cache: false,
                    }).then(function(result) {
                        nextRequest = new Date().getTime();
                        resolve(parsers[type](result));
                    }, function(err) {
                        throw "Error " + err.status + ":" + err.statusText;
                    });

                }, nextRequest - new Date().getTime());

            });
        };

        getToken = function(isTokenExpired) {
            isTokenExpired = (isTokenExpired == undefined) ? false : isTokenExpired;
            if (isTokenExpired) {
                service.activeToken = null;
                activeTokenRequest = false;
            };
            if (!activeTokenRequest && !service.activeToken) {
                activeTokenRequest = promiseRequest('token').then(function(token) {
                    service.activeToken = token.token;
                    return token.token;
                });
            } else if (service.activeToken) {
                return $q(function(resolve) {
                    return resolve(service.activeToken);
                });
            }
            return activeTokenRequest;
        };

        var service = {
            activeToken: null,
            config: {
                orderby: {
                    leechers: {d: 'leechers', a: 'leechers'},
                    seeders: {d: 'seeders', a: 'seeders'}
                }
            },
            cancelActiveRequest: function() {
                if(activeSearchRequest) {
                    activeSearchRequest.resolve();
                }
            },
            search: function(what, noCancel, orderBy, isTokenExpired) {
                noCancel = (noCancel == undefined) ? false : noCancel; 
                orderBy= (orderBy == undefined) ? 'seeders.d' : orderBy; 
                isTokenExpired = (isTokenExpired == undefined) ? false : isTokenExpired;
                if (noCancel === false) {
                    service.cancelSearch();
                };
                if (!activeSearchRequest) {
                    activeSearchRequest = $q.defer();
                    return getToken(isTokenExpired).then(function(token) {
                        return promiseRequest('search', token, what, orderBy, activeSearchRequest.promise).then(function(results) {
                            if (activeSearchRequest && activeSearchRequest.resolve) {
                                activeSearchRequest.resolve(true);
                            };
                            activeSearchRequest = false;
                            if (results === 4) { // token expired
                                return service.search(what, true, orderBy, true);
                            } else if (results === 5) { // retry later
                                return service.search(what, true, orderBy);
                            };
                            return results;
                        });
                    });
                } else {
                    // delay search until current one is complete
                    return activeSearchRequest.promise.then(function() {
                        return service.search(what, true, orderBy);
                    });
                }
            },
            cancelSearch: function() {
                if (activeSearchRequest && activeSearchRequest.resolve) {
                    activeSearchRequest.reject("search abort");
                    activeSearchRequest = false;
                }
            }
        };
        return service;
    }
])

.run(["TorrentSearchEngines", "SettingsService", "RarBG",
    function(TorrentSearchEngines, SettingsService, RarBG) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('RarBG', RarBG);
        }
    }
]);