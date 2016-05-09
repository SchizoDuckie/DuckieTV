/** 
 * Automatic mirror resolver for ThePirateBay by utilizing
 * GeenStijl.nl's fucktimkuik.org
 */
DuckieTV.factory('ThePirateBayMirrorResolver', ["$q", "$http", "$injector",
    function($q, $http, $injector) {

        var $rootScope = $injector.get('$rootScope'),
            maxAttempts = 3,
            endpoints = {
                thepiratebay: 'http://www.piratebayproxylist.co/'
            };

        /**
         * Switch between search and details
         */
        function getUrl(type) {
            return endpoints[type];
        }

        /**
         * Find a random mirror from piratebayproxylist.com
         */
        function parsePirateBayProxyList(result) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(result.data, "text/html");
            var resultList = doc.querySelectorAll('.post-body a[rel=nofollow]');
            return resultList[Math.floor(Math.random() * resultList.length)].href;
        }


        /** 
         * When a TPB test search has been executed, verify that at least one magnet link is available in the
         * expected layout. (Some proxies proxy your magnet links so they can track them, we don't want that.)
         */
        function parseTPBTestSearch(result, allowUnsafe) {
            var parser = new DOMParser();
            return result.data.indexOf('magnet:') > -1;
        }

        var service = {
            /**
             * Find a random mirror for ThePirateBay and return the promise when
             * one is found and verified. If a valid working server is not found within x tries, it fails.
             * Provides up-to-date status messages via mirrorresolver:status while doing that
             */
            findTPBMirror: function(attempt) {
                attempt = attempt || 1;
                $rootScope.$broadcast('tpbmirrorresolver:status', 'Finding a random TPB Mirror, attempt ' + attempt);
                var d = $q.defer();
                $http({ // fetch the document that gives a mirror
                    method: 'GET',
                    url: getUrl('thepiratebay'),
                    cache: false
                }).then(function(response) {
                    // parse the response
                    var location = parsePirateBayProxyList(response);
                    $rootScope.$broadcast('tpbmirrorresolver:status', "Found ThePirateBay mirror! " + location + " Verifying if it uses magnet links.");
                    // verify that the mirror works by executing a test search, otherwise try the process again
                    service.verifyTPBMirror(location).then(function(location) {
                        //console.debug("Mirror uses magnet links!", location);
                        d.resolve(location);
                    }, function(err) {
                        if (attempt < maxAttempts) {
                            if (err.status)
                                $rootScope.$broadcast('tpbmirrorresolver:status', "Mirror does not do magnet links.. trying another one.");
                            d.resolve(service.findTPBMirror(attempt + 1));
                        } else {
                            $rootScope.$broadcast("tpbmirrorresolver:status", "Could not resolve a working mirror in " + maxAttempts + " tries. TPB is probably down.");
                            d.reject("Could not resolve a working mirror in " + maxAttempts + " tries. TPB is probably down.");
                        }
                    });
                }, function(err) {
                    console.error('error!');
                    d.reject(err);
                });
                return d.promise;
            },
            /**
             * alias for GenericTorrentSearchEngine.js
             */
            findMirror: function() {
                return service.findTPBMirror();
            },
            /**
             * Verify that a specific TPB mirror is working and using magnet links by executing a test search
             * Parses the results and checks that magnet links are available like they are on TPB.
             * Some mirrors will not provide direct access to magnet links so we filter those out
             */
            verifyTPBMirror: function(location, maxTries) {
                if (maxTries) {
                    maxAttempts = maxTries;
                };
                $rootScope.$broadcast('tpbmirrorresolver:status', "Verifying if mirror is using magnet links!: " + location);
                var q = $q.defer();
                var slash = '';

                if (location.substr(location.length - 1) !== '/') {
                    slash = '/';
                }
                testLocation = location + slash + "search/test/0/7/0";
                $http({
                    method: 'GET',
                    url: testLocation
                }).then(function(response) {
                    $rootScope.$broadcast('tpbmirrorresolver:status', "Results received, parsing");
                    if (parseTPBTestSearch(response, $rootScope.getSetting('proxy.allowUnsafe'))) {
                        $rootScope.$broadcast('tpbmirrorresolver:status', "Yes it does!");
                        q.resolve(location);
                    } else {
                        $rootScope.$broadcast('tpbmirrorresolver:status', "This is a mirror that intercepts magnet links. bypassing.");
                        q.reject(location);
                    }
                }, function(err) {
                    $rootScope.$broadcast('tpbmirrorresolver:status', 'error! HTTP Status: ' + angular.toJson(err.status));
                    q.reject(err);
                });
                return q.promise;
            }
        };

        return service;
    }


]);