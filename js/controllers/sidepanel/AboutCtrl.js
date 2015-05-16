/**
 * Fetches and displays various statistics about current DuckieTV Setup on About Page
 */
DuckieTV.controller('AboutCtrl', ["$scope", "$rootScope", "$q", "$http", "$filter", "$injector", "SettingsService", "StorageSyncService", "TorrentSearchEngines",
    function($scope, $rootScope, $q, $http, $filter, $injector, SettingsService, StorageSyncService, TorrentSearchEngines) {

        // If we load onto the page highlight the button
        document.querySelector('#actionbar_about').classList.add('active');

        $scope.statistics = [];

        getStats = function() {
            // Get Screen Size
            var screenSize = '';
            if (screen.width) {
                width = (screen.width) ? screen.width : '';
                height = (screen.height) ? screen.height : '';
                screenSize += '' + width + " x " + height;
            };

            // Get Database Stats
            countEntity = function(entity) {
                CRUD.EntityManager.getAdapter().db.execute('select count(*) as count from ' + entity).then(function(result) {
                    $scope.statistics.push({
                        name: "DB " + entity,
                        data: result.next().row.count
                    });
                });
            };

            // Count shows hidden from calendar
            countHiddenShows = function() {
                CRUD.EntityManager.getAdapter().db.execute("select count(displaycalendar) as count from Series where displaycalendar like 0").then(function(result) {
                    $scope.statistics.push({
                        name: "DB Series Hidden From Calendar",
                        data: result.next().row.count
                    });
                });
            };

            // Get sync stats
            getSyncTime = function() {
                /*
                 * if sync is supported get the synctime else indicate not available
                 */
                if (StorageSyncService.isSupported()) {
                    StorageSyncService.get('lastSync').then(function(syncTime) {
                        if (syncTime != null) {
                            $scope.statistics.push({
                                name: 'Storage Sync Last Synced on',
                                data: new Date(syncTime).toGMTString()
                            });
                        } else {
                            $scope.statistics.push({
                                name: 'Storage Sync has',
                                data: 'Never Signed in to Google'
                            });
                        };
                    });
                } else {
                    $scope.statistics.push({
                        name: 'Storage Sync is',
                        data: 'Not Available'
                    });
                };
            };

            // Get current torrent mirror
            var activeTorrentingMirror = TorrentSearchEngines.getDefaultEngine().config.mirror;

            // Get date of last trakt update
            var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')));

            // General misc stats
            $scope.statistics = [{
                name: 'UserAgent',
                data: navigator.userAgent
            }, {
                name: 'Platform, Vendor',
                data: navigator.platform + ', ' + navigator.vendor
            }, {
                name: 'Screen (width x height)',
                data: screenSize
            }, {
                name: 'Active Torrenting URL',
                data: activeTorrentingMirror
            }, {
                name: 'Last checked TraktTV for DB updates on',
                data: lastUpdated.toGMTString()
            }];

            // DuckieTV version
            if ('chrome' in window && 'app' in window.chrome && 'getDetails' in chrome.app && window.chrome.app.getDetails() != null && 'version' in window.chrome.app.getDetails()) {
                $scope.statistics.unshift({
                    name: window.chrome.app.getDetails().short_name,
                    data: window.chrome.app.getDetails().version
                });
            } else {
                $http({
                    method: 'GET',
                    url: 'VERSION'
                }).
                success(function(data, status, headers, config) {
                    $scope.statistics.unshift({
                        name: 'DuckieTV webbased',
                        data: data
                    });
                });
            }

            // Local date and time in GMT presentation
            $scope.statistics.unshift({
                name: 'Current Date and Time',
                data: new Date().toGMTString()
            });

            //getSyncTime();
            countEntity('Series');
            countHiddenShows();
            countEntity('Seasons');
            countEntity('Episodes');

            // dump user preferences, redact passwords
            var userPrefs = angular.fromJson(localStorage.getItem('userPreferences'));
            angular.forEach(userPrefs, function(value, key) {
                if (key.indexOf('password') > -1) {
                    userPrefs[key] = "*****";
                };
            });
            $scope.statistics.push({
                name: 'User Preferences on Local Storage',
                data: angular.toJson(userPrefs,true)
            });

        }
        getStats();
    }
]);