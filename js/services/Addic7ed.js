angular.module('DuckieTV.providers.addic7ed', [])


.factory('Addic7ed', function($q, $http) {

    var endpoint = 'http://www.addic7ed.com/';

    var endpoints = {
        list: 'shows.php',
        serie: 'ajax_loadShow.php?show=%s&season=%s&langs=&hd=undefined&hi=undefined'
    };
    var cachedList = null;

    var getUrl = function(type, param, param2) {
        var out = endpoint + endpoints[type].replace('%s', encodeURIComponent(param));
        return (param2 !== undefined) ? out.replace('%s', encodeURIComponent(param2)) : out;
    };

    var parsers = {
        list: function(result) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(result.data, "text/html");
            var results = doc.querySelectorAll('td.version a[href^="/show"]')
            var output = {};
            Array.prototype.map.call(results, function(node) {
                if (node.value == "") return;
                output[node.innerText.trim()] = node.getAttribute('href').replace('/show/', '');
            });
            cachedList = output;
            return output;
        },
        serie: function(result) {

            var parser = new DOMParser();
            var doc = parser.parseFromString('<html><body>' + result.data + '</body></html>', "text/html");
            var results = doc.querySelectorAll('div#season tbody tr');
            var output = [];
            Array.prototype.map.call(results, function(node) {
                if (node.querySelector('td:nth-child(10)')) {
                    output.push({
                        season: node.querySelector('td:nth-child(1)').innerText,
                        episode: node.querySelector('td:nth-child(2)').innerText,
                        title: node.querySelector('td:nth-child(3)').innerText,
                        language: node.querySelector('td:nth-child(4)').innerText,
                        release: node.querySelector('td:nth-child(5)').innerText,
                        progress: node.querySelector('td:nth-child(6)').innerText,
                        isHearingImpaired: node.querySelector('td:nth-child(6)').innerText,
                        isCorrected: node.querySelector('td:nth-child(7)').innerText,
                        is720p: node.querySelector('td:nth-child(8)').innerText == '✔',
                        is1080p: node.querySelector('td:nth-child(9)').innerText == '✔',
                        link: 'http://www.addic7ed.com' + node.querySelector('td:nth-child(10) a').getAttribute('href'),
                    });
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

    var listShows = function() {
        if (cachedList != null) {
            return $q(function() {
                return cachedList;
            });
        }
        return promiseRequest('list')
    }

    return {

        search: function(serie, seasonNumber, episodeNumber) {
            return listShows().then(function(results) {
                var found = results[serie.name];
                if (found !== undefined) {
                    return promiseRequest('serie', found, seasonNumber).then(function(results) {
                        return results.filter(function(el) {
                            return el.episode == episodeNumber;
                        })
                    })
                }
            });
        }
    }

});