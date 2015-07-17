/** 
 * GetStrike.net custom Torrent API interfacing.
 * Fetches list of torrent results and tries to fetch the magnet links for an episode.
 */
DuckieTV.factory('Strike', ["$q", "$http",
    function($q, $http) {

        var activeSearchRequest = false;
        var endpoint = 'https://getstrike.net/api/v2/torrents/';

        var endpoints = {
            search: 'search/?phrase=%s',
        };

        var getUrl = function(type, param, param2) {
            var out = endpoint + endpoints[type].replace('%s', encodeURIComponent(param));
            return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
        };

        function parseSearch(result) {
            var output = [];
            var torrents = result.data.torrents;
            for (var i = 0; i < torrents.length; i++) {
                var out = {
                    magneturl: torrents[i].magnet_uri,
                    releasename: torrents[i].torrent_title,
                    size: Math.round(((torrents[i].size / 1024 / 1024) + 0.00001) * 100) / 100 + " MB",
                    seeders: torrents[i].seeds,
                    leechers: torrents[i].leeches,
                    detailUrl: torrents[i].page
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
                return parseSearch(result);
            }, function(err) {
                console.error("Strike Search Error!", err);
                if (err.status == 404) { // 404 on strike means no results.
                    return [];
                }
                throw "Error " + err.status + ":" + err.statusText;
            });
        };

        var service = {
            search: function(what) {
                service.cancelSearch();
                activeSearchRequest = $q.defer();
                // Strike doesn't seem to like trailing spaces
                return promiseRequest('search', what.trim(), null, activeSearchRequest.promise).then(function(results) {
                    activeSearchRequest = false;
                    return results;
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

.run(["TorrentSearchEngines", "SettingsService", "Strike",
    function(TorrentSearchEngines, SettingsService, Strike) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('Strike', Strike);
        }
    }
]);