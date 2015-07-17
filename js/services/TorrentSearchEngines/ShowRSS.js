/** 
 * ShowRSS.info custom Torrent API interfacing.
 * Scrapes the shows list from ShowRSS.info and tries to fetch the magnet links for an episode.
 */
DuckieTV.factory('ShowRSS', ["$q", "$http",
    function($q, $http) {

        var activeSearchRequest = false,
            activeTrendingRequest = false;

        var endpoint = 'https://showrss.info/';

        var endpoints = {
            list: '?cs=browse',
            serie: '?cs=browse&show=%s'
        };

        var getUrl = function(type, param, param2) {
            var out = endpoint + endpoints[type].replace('%s', encodeURIComponent(param));
            return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
        };

        var parsers = {
            list: function(result) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(result.data, "text/html");
                var results = doc.querySelectorAll("select option");
                var output = {};
                Array.prototype.map.call(results, function(node) {
                    if (node.value === "") return;
                    output[node.innerText.trim()] = node.value;
                });
                return output;
            },
            serie: function(result) {

                var parser = new DOMParser();
                var doc = parser.parseFromString(result.data, "text/html");
                var results = doc.querySelectorAll("#show_timeline div.showentry > a");
                var output = [];
                Array.prototype.map.call(results, function(node) {

                    var out = {
                        magneturl: node.href,
                        releasename: node.innerText,
                        size: 'n/a',
                        seeders: 'n/a',
                        leechers: 'n/a',
                        detailUrl: doc.querySelector("a[href^='/?cs=browse&']").href
                    };

                    var magnetHash = out.magneturl.match(/([0-9ABCDEFabcdef]{40})/);
                    if (magnetHash && magnetHash.length) {
                        out.torrent = 'http://torcache.gs/torrent/' + magnetHash[0].toUpperCase() + '.torrent?title=' + encodeURIComponent(out.releasename.trim());
                        output.push(out);
                    }
                });
                return output;
            }
        };

        /** 
         * If a customized parser is available for the data, run it through that.
         */
        var getParser = function(type) {
            return type in parsers ? parsers[type] : function(data) {
                return data.data;
            };
        };

        /** 
         * Promise requests with batchmode toggle to auto-kill a previous request when running.
         * The activeRequest and batchMode toggles make sure that find-as-you-type can execute multiple
         * queries in rapid succession by aborting the previous one. Can be turned off at will by using enableBatchMode()
         */
        var promiseRequest = function(type, param, param2, promise) {

            var url = getUrl(type, param, param2);
            var parser = getParser(type);

            return $http.get(url, {
                timeout: promise ? promise : 30000,
                cache: true
            }).then(function(result) {
                return parser(result);
            });
        };

        return {
            search: function(query) {
                //console.debug("Searching showrss!", query);
                if (!query.toUpperCase().match(/S([0-9]{1,2})E([0-9]{1,3})/)) {
                    return $q(function(resolve, reject) {
                        reject("Sorry, ShowRSS only works for queries in format : 'Seriename SXXEXX'");
                    });
                }
                return promiseRequest('list').then(function(results) {
                    var found = Object.keys(results).filter(function(value) {
                        return query.indexOf(value) === 0;
                    });
                    if (found.length == 1) {
                        var serie = found[0];

                        return promiseRequest('serie', results[found[0]]).then(function(results) {
                            var seasonepisode = query.replace(serie, '').trim().toUpperCase();
                            var parts = seasonepisode.match(/S([0-9]{1,2})E([0-9]{1,3})/);
                            if (seasonepisode.length === 0) return results;
                            seasonepisode = seasonepisode.replace('S' + parts[1], parseInt(parts[1], 10)).replace('E' + parts[2], 'x' + parts[2]);
                            var searchparts = seasonepisode.split(' ');
                            return results.filter(function(el) {
                                if (searchparts.length > 1 && el.releasename.indexOf(searchparts[1]) == -1) {
                                    return false;
                                }
                                return el.releasename.indexOf(searchparts[0]) > -1;
                            });
                        });
                    } else {
                        return [];
                    }
                });
            }
        };
    }
])


.run(["TorrentSearchEngines", "SettingsService", "ShowRSS",
    function(TorrentSearchEngines, SettingsService, ShowRSS) {
        if (SettingsService.get('torrenting.enabled')) {
            TorrentSearchEngines.registerSearchEngine('ShowRSS', ShowRSS);
        }
    }
]);