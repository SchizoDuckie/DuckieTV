function GenericTorrentSearchEngine(config, $q, $http, $injector) {

    var activeRequest = null;

    this.config = config;

    /**
     * Switch between search and details
     */
    function getUrl(type, param) {
        return config.mirror + config.endpoints[type].replace('%s', encodeURIComponent(param));
    };

    /**
     * Generic search parser that has a selector, a property to fetch from the selector and an optional callback function for formatting/modifying
     */
    function parseSearch(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var selectors = config.selectors;
        var results = doc.querySelectorAll(selectors.resultContainer);
        var output = [];

        function getPropertyForSelector(parentNode, propertyConfig) {
            var node = parentNode.querySelector(propertyConfig[0]);
            if (!node) return null;
            var propertyValue = node.getAttribute(propertyConfig[1]) !== null ? node.getAttribute(propertyConfig[1]) : node[propertyConfig[1]];
            return propertyConfig.length == 3 && null !== propertyConfig[2] && typeof(propertyConfig[2]) == 'function' ? propertyConfig[2](propertyValue) : propertyValue;
        }

        for (var i = 0; i < results.length; i++) {
            var magnet = getPropertyForSelector(results[i], selectors.magneturl);
            var releasename = getPropertyForSelector(results[i], selectors.releasename);
            if (releasename === null || (magnet === null && !selectors.detailUrlMagnet)) continue;
            var out = {
                magneturl: magnet,
                releasename: releasename,
                size: getPropertyForSelector(results[i], selectors.size),
                seeders: getPropertyForSelector(results[i], selectors.seeders),
                leechers: getPropertyForSelector(results[i], selectors.leechers),
                detailUrl: config.mirror + getPropertyForSelector(results[i], selectors.detailUrl)
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
     * Execute a generic torrent search, parse the results and return them as an array
     */
    this.search = function(what, noCancel) {
        what = what.replace(/\'/g, '');
        var d = $q.defer();
        if (noCancel !== true && activeRequest) {
            activeRequest.resolve();
        }
        activeRequest = $q.defer();
        $http({
            method: 'GET',
            url: getUrl('search', what),
            cache: false,
            timeout: activeRequest.promise
        }).then(function(response) {
            //console.log("Torrent search executed!", response);
            d.resolve(parseSearch(response));
        }, function(err) {
            if (err.status > 300) {
                if (config.mirrorResolver && config.mirrorResolver !== null) {
                    $injector.get(config.mirrorResolver).findMirror().then(function(result) {
                        //console.log("Resolved a new working mirror!", result);
                        mirror = result;
                        return service.search(what);
                    }, function(err) {
                        d.reject(err);
                    });
                }
            }
        });
        return d.promise;
    },
    /**
     * Fetch details for a specific torrent id
     */
    this.torrentDetails = function(id) {
        return $http({
            method: 'GET',
            url: self.getUrl('details', id),
            cache: true
        }).success(function(response) {
            return {
                result: self.parseDetails(response)
            };
        });
    }

}