angular.module('DuckieTV.providers.mirrorresolver', [])

/** 
 * Automatic mirror resolver for ThePirateBay by utilizing
 * GeenStijl.nl's fucktimkuik.org
 */
.provider('MirrorResolver', function() {

	// individual mirror resolvers can be added here
    this.endpoints = {
        thepiratebay: 'http://fucktimkuik.org/',
    };
    this.rootScope = false;

    /**
     * Switch between search and details
     */
    this.getUrl = function(type) {
        return this.endpoints[type];
    },

    /** 
     * FuckTimKuik.org provides a meta refresh parameter that contains the random mirror.
     * Parse the result as a DOM Document, and fetch the attribute from the request tag, and split the url off
     */ 
    this.parseFuckTimKuik = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var result = doc.querySelector("meta[http-equiv=refresh]").content.split('url=')[1];
        return result;
    }

    /** 
     * When a test search has been executed, verify that at least one magnet link is available in the
     * expected layout. (Some proxies proxy your magnet links so they can track them, we don't want that.)
     */ 
    this.parseTestSearch = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var result = doc.querySelector("#searchResult > tbody > tr:nth-child(1) > td:nth-child(2) > a:nth-child(2)");
        return result && result.href && result.href.indexOf('magnet') == 0;
    }

    /**
     * Get wrapper, providing the actual search functions and result parser
     * Provides promises so it can be used in typeahead as well as in the rest of the app
     */
    this.$get = function($q, $http, $rootScope) {
        var self = this;
        var maxAttempts = 3;
        return {
            /**
             * Find a random mirror for ThePirateBay and return the promise when
             * one is found and verified. If a valid working server is not found within x tries, it fails.
             * Provides up-to-date status messages via mirrorresolver:status while doing that
             */
            findTPBMirror: function(attempt) {
                attempt = attempt || 1;
                $rootScope.$broadcast('mirrorresolver:status', 'Finding a random TPB Mirror, attempt ' + attempt);
                var d = $q.defer();
                $http({ // fetch the document that gives a mirror
                    method: 'GET',
                    url: self.getUrl('thepiratebay'),
                    cache: false
                }).then(function(response) {
                	// parse the response
                    var location = self.parseFuckTimKuik(response);
                    $rootScope.$broadcast('mirrorresolver:status', "Found ThePirateBay mirror! " + location + " Verifying if it uses magnet links.");
                    // verify that the mirror works by executing a test search, otherwise try the process again
                    self.$get($q, $http, $rootScope).verifyMirror(location).then(function(location) {
                        console.log("Mirror uses magnet links!", location);
                        d.resolve(location);
                    }, function(err) {
                        if (attempt < maxAttempts) {
                            if (err.status)
                                $rootScope.$broadcast('mirrorresolver:status', "Mirror does not do magnet links.. trying another one.");
                            d.resolve(self.$get($q, $http, $rootScope).findTPBMirror(attempt + 1));
                        } else {
                            $rootScope.$broadcast("mirrorresolver:status", "Could not resolve a working mirror in " + maxAttempts + " tries. TPB is probably down.");
                            d.reject("Could not resolve a working mirror in " + maxAttempts + " tries. TPB is probably down.");
                        }
                    });
                }, function(err) {
                    console.log('error!');
                    d.reject(err);
                });
                return d.promise;
            },
            /** 
             * Verify that a mirror is working and using magnet links by executing a test search
             * Parses the results and checks that magnet links are available like they are on tpb.
             * Some mirrors will not provide direct access to magnet links so we filter those out
             */
            verifyMirror: function(location, maxTries) {
                if (maxTries) {
                    maxAttempts = tries;
                }
                $rootScope.$broadcast('mirrorresolver:status', "Verifying if mirror is using magnet links!: " + location);
                var q = $q.defer();

                testLocation = location + "/search/test/0/7/0";
                $http({
                    method: 'GET',
                    url: testLocation
                }).then(function(response) {
                    $rootScope.$broadcast('mirrorresolver:status', "Results received, parsing");
                    if (self.parseTestSearch(response)) {
                        $rootScope.$broadcast('mirrorresolver:status', "Yes it does!");
                        q.resolve(location);
                    } else {
                        $rootScope.$broadcast('mirrorresolver:status', "This is a mirror that intercepts magnet links. bypassing.");
                        q.reject(location);
                    }
                }, function(err) {
                    $rootScope.$broadcast('mirrorresolver:status', 'error! HTTP Status: ' + angular.toJson(err.status));
                    q.reject(err);
                });
                return q.promise;

            }
        }
    }
});