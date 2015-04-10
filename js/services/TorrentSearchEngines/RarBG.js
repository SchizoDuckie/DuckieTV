/** 
 * RARBG.com API interface via torrentapi.org..
 * Fetches list of torrent results and tries to fetch the magnet links for an episode.
 */
DuckieTV.factory('RarBG', ["$q", "$http",
    function($q, $http) {

        var activeSearchRequest = false;
        var endpoint = 'https://torrentapi.org/pubapi.php?';

        var endpoints = {
            search: 'token=%s&mode=search&search_string=%s&sort=seeders&limit=25&format=json',
            token: 'get_token=get_token&format=json'
        };

        var getUrl = function(type, param, param2) {
            var out = endpoint + endpoints[type].replace('%s', escape(param));
            return (param2 !== undefined) ? out.replace('%s', escape(param2)) : out;
        };

        var parsers = {
            search: function(result) {
                var output = [];
                if (result.data == "No results found" || result.data == "Too many requests per minute. Please try again later!") {
                    return output;
                }
                result.data.map(function(hit) {
                    var out = {
                        magneturl: hit.d,
                        releasename: hit.f,
                        size: "N/A",
                        seeders: "N/A",
                        leechers: "N/A"
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
                return result.data.token;
            }

        }

        /** 
         * Promise requests with batchmode toggle to auto-kill a previous request when running.
         * The activeRequest and batchMode toggles make sure that find-as-you-type can execute multiple
         * queries in rapid succession by aborting the previous one. Can be turned off at will by using enableBatchMode()
         */
        var promiseRequest = function(type, param, param2, promise) {
            var url = getUrl(type, param, param2);

            return $http.get(url, {
                timeout: promise ? promise : 120000,
                cache: false,
            }).then(function(result) {
                return parsers[type](result);
            }, function(err) {
                console.error("RarBG Search Error!", err);
                throw "Error " + err.status + ":" + err.statusText;
            });
        }

        var service = {
            search: function(what) {
                service.cancelSearch();
                activeSearchRequest = $q.defer();
                return promiseRequest('token').then(function(token) {
                    return promiseRequest('search', token, what, activeSearchRequest.promise).then(function(results) {
                        activeSearchRequest = false;
                        return results;
                    });
                })
            },
            cancelSearch: function() {
                if (activeSearchRequest && activeSearchRequest.resolve) {
                    activeSearchRequest.reject("search abort");
                    activeSearchRequest = false;
                }
            }
        }
        return service;
    }
])

.run(["TorrentSearchEngines", "RarBG",
    function(TorrentSearchEngines, RarBG) {
        TorrentSearchEngines.registerSearchEngine('RarBG', RarBG);
    }
])
