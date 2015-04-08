/** 
 * Automatic mirror resolver for KickassTorrent by utilizing unlocktorrent.com
 */
DuckieTV.provider('KickassMirrorResolver', function() {

    // Individual mirror resolvers can be added here
    this.endpoints = {
        kickasstorrents: 'http://www.rockaproxy.com/allTorrentLinksPage.php'
    };
    var failedMirrors = []; // Keep a list of failed mirrors so that we don't try the same one twice.

    /**
     * Switch between search and details
     */
    this.getUrl = function(type) {
        return this.endpoints[type];
    },

    /** 
     * Pick a random mirror for KickAssTorrents from piratelist.net
     * run them through array.prototype.<function>.call
     */
    this.parseRockAProxy = function(result) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");

        var mirrorList = [];
        Array.prototype.map.call(doc.querySelectorAll('td span[id="linknametext"]'), function(el) {
            if (el.parentNode.innerText.indexOf('KickAssTorrents') > -1) {
                mirrorList.push(el.parentNode.innerText.trim().replace('KickAssTorrents - ', ''));
            }
        });
        console.log("MirrorList", mirrorList);
        return pickRandomMirror(mirrorList);
    }

    function pickRandomMirror(mirrorList) {
        var item = mirrorList[Math.floor(Math.random() * mirrorList.length - 1)];
        do {
            item = mirrorList[Math.floor(Math.random() * mirrorList.length - 1)];
        } while (failedMirrors.indexOf(item) > -1)
        return item;
    }

    /** 
     * When a Kickass Torrent test search has been executed, verify that at least one magnet link is available in the
     * expected layout. (Some proxies proxy your magnet links so they can track them, we don't want that.)
     */
    this.parseKATTestSearch = function(result, allowUnsafe) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(result.data, "text/html");
        var result = doc.querySelector('table.data tr > td:nth-child(1) > div.iaconbox.floatright > a.imagnet.icon16');
        doc = null;
        parser = null;
        return result && result.href && (allowUnsafe ? true : result.href.indexOf('magnet') == 0);
    }

    /**
     * Get wrapper, providing the actual search functions and result parser
     * Provides promises so it can be used in typeahead as well as in the rest of the app
     */
    this.$get = ["$q", "$http", "$rootScope",
        function($q, $http, $rootScope) {
            var self = this;
            var maxAttempts = 50;
            return {
                /**
                 * Find a random mirror for KickAss Torrents and return the promise when
                 * one is found and verified. If a valid working server is not found within x tries, it fails.
                 * Provides up-to-date status messages via mirrorresolver:status while doing that
                 */
                findKATMirror: function(attempt) {
                    attempt = attempt || 1;
                    $rootScope.$broadcast('katmirrorresolver:status', 'Finding a random KAT Mirror, attempt ' + attempt);
                    var d = $q.defer();
                    $http({ // Fetch the document that gives a mirror
                        method: 'GET',
                        url: self.getUrl('kickasstorrents'),
                        cache: false
                    }).then(function(response) {
                        // Parse the response
                        var location = self.parseRockAProxy(response);
                        console.log('mirror picked', response);
                        $rootScope.$broadcast('katmirrorresolver:status', "Found KickAss Torrents mirror! " + location + " Verifying if it uses magnet links.");
                        // Verify that the mirror works by executing a test search, otherwise try the process again
                        self.$get($q, $http, $rootScope).verifyKATMirror(location).then(function(location) {
                            console.log("Mirror uses magnet links!", location);
                            d.resolve(location);
                        }, function(err) {
                            if (attempt < maxAttempts) {
                                failedMirrors.push(location);
                                if (err.status)
                                    $rootScope.$broadcast('katmirrorresolver:status', "Mirror does not do magnet links.. trying another one.");
                                d.resolve(self.$get($q, $http, $rootScope).findKATMirror(attempt + 1));
                            } else {
                                $rootScope.$broadcast("katmirrorresolver:status", "Could not resolve a working mirror in " + maxAttempts + " tries. KAT is probably down.");
                                d.reject("Could not resolve a working mirror in " + maxAttempts + " tries. KAT is probably down.");
                            }
                        });
                    }, function(err) {
                        console.log('error!');
                        d.reject(err);
                    });
                    return d.promise;
                },
                /** 
                 * Verify that a specific KAT mirror is working and using magnet links by executing a test search
                 * Parses the results and checks that magnet links are available like they are on KAT.
                 * Some mirrors will not provide direct access to magnet links so we filter those out
                 */
                verifyKATMirror: function(location, maxTries) {
                    if (maxTries) {
                        maxAttempts = maxTries;
                    };
                    $rootScope.$broadcast('katmirrorresolver:status', "Verifying if mirror is using magnet links!: " + location);
                    var q = $q.defer();

                    testLocation = location + "usearch/test";
                    $http({
                        method: 'GET',
                        url: testLocation
                    }).then(function(response) {
                        $rootScope.$broadcast('katmirrorresolver:status', "Results received, parsing");
                        if (self.parseKATTestSearch(response, $rootScope.getSetting('proxy.allowUnsafe'))) {
                            $rootScope.$broadcast('katmirrorresolver:status', "Yes it does!");
                            q.resolve(location);
                        } else {
                            $rootScope.$broadcast('katmirrorresolver:status', "This is a mirror that intercepts magnet links. bypassing.");
                            q.reject(location);
                        }
                    }, function(err) {
                        $rootScope.$broadcast('katmirrorresolver:status', 'error! HTTP Status: ' + angular.toJson(err.status));
                        q.reject(err);
                    });
                    return q.promise;
                },

            }
        }
    ]
});