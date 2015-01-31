angular.module('DuckieTV.providers.showrss', [])

/** 
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
.factory('ShowRSS', function($q, $http) {

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
                if (node.value == "") return;
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
                    detailUrl: ''
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
            return promiseRequest('list').then(function(results) {
                var found = Object.keys(results).filter(function(value) {
                    return query.indexOf(value) == 0
                });
                if (found.length == 1) {
                    return promiseRequest('serie', results[found[0]]);
                }
            });
        }
    }

});