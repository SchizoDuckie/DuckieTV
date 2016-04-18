/** 
 * RARBG.com API interface via torrentapi.org..
 * Fetches list of torrent results and tries to fetch the magnet links for an episode.
 * http://torrentapi.org/apidocs_v2.txt
 */
DuckieTV.factory('RarBG', ["$q", "$http",
    function($q, $http) {

        var activeSearchRequest = false,
            activeTokenRequest = false,
            endpoint = 'https://torrentapi.org/pubapi_v2.php?app_id=DuckieTV&';

        var endpoints = {
            search: 'token=%s&mode=search&search_string=%s&sort=seeders&limit=25&ranked=0&format=json_extended',
            token: 'get_token=get_token&format=json_extended'
        };

        var getUrl = function(type, param, param2) {
            var out = endpoint + endpoints[type].replace('%s', escape(param));
            return (param2 !== undefined) ? out.replace('%s', escape(param2)) : out;
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
                        magneturl: hit.download,
                        releasename: hit.title,
                        size: (hit.size / 1024 / 1024).toFixed(2) + " MB",
                        seeders: hit.seeders,
                        leechers: hit.leechers,
                        detailUrl: hit.info_page
                    };

                    var magnetHash = out.magneturl.match(/([0-9ABCDEFabcdef]{40})/);
                    if (magnetHash && magnetHash.length) {
                        out.torrent = 'http://torcache.gs/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
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
         * Promise requests with batchmode toggle to auto-kill a previous request when running.
         * The activeRequest and batchMode toggles make sure that find-as-you-type can execute multiple
         * queries in rapid succession by aborting the previous one. Can be turned off at will by using enableBatchMode()
         */
        var nextRequest = new Date().getTime();

        var promiseRequest = function(type, param, param2, promise) {
            var url = getUrl(type, param, param2);
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
            if (!isTokenExpired) {
                isTokenExpired = false;
            };
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
                noMagnet: false
            },
            search: function(what, noCancel, isTokenExpired) {
                if (!noCancel) {
                   noCancel = false; 
                };
                if (!isTokenExpired) {
                    isTokenExpired = false;
                };
                if (noCancel !== true) {
                    service.cancelSearch();
                };
                activeSearchRequest = $q.defer();
                return getToken(isTokenExpired).then(function(token) {
                    return promiseRequest('search', token, what, activeSearchRequest.promise).then(function(results) {
                        activeSearchRequest = false;
                        if (results === 4) { // token expired
                            return service.search(what, true, true);
                        } else if (results === 5) { // retry later
                            return service.search(what, true);
                        };
                        return results;
                    });
                });
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