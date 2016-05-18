/**
 * Fetches and displays various statistics about current DuckieTV Setup on About Page
 */
DuckieTV.controller('AboutCtrl', ["$scope", "$rootScope", "$q", "$http", "$filter", "$injector", "SettingsService", "StorageSyncService", "TorrentSearchEngines",
    function($scope, $rootScope, $q, $http, $filter, $injector, SettingsService, StorageSyncService, TorrentSearchEngines) {

        // If we load onto the page highlight the button
        document.querySelector('#actionbar_about').classList.add('active');

        $scope.statistics = [];

        // defined by utility.js
        $scope.optInTrackingEnabled = localStorage.getItem('optin_error_reporting');
        $scope.uniqueTrackingID = localStorage.getItem('uniqueId');

        $scope.toggleOptInErrorReporting = function() {
            if (localStorage.getItem('optin_error_reporting')) {
                localStorage.removeItem('optin_error_reporting');
                localStorage.removeItem('optin_error_reporting.start_time');
                $injector.get('DuckietvReload').windowLocationReload();
            } else {
                localStorage.setItem('optin_error_reporting', true);
                localStorage.setItem('optin_error_reporting.start_time', new Date().getTime());
                $injector.get('DuckietvReload').windowLocationReload();
            }
        };

        var getStats = function() {
            // Get Screen Size
            var screenSize = '';
            if (screen.width) {
                var width = (screen.width) ? screen.width : '',
                    height = (screen.height) ? screen.height : '';
                screenSize += '' + width + " x " + height;
            }

            // Get Database Stats
            var countEntity = function(entity) {
                CRUD.executeQuery('select count(*) as count from ' + entity).then(function(result) {
                    $scope.statistics.push({
                        name: "DB " + entity,
                        data: result.next().row.count
                    });
                });
            };

            // Count shows hidden from calendar
            var countHiddenShows = function() {
                CRUD.executeQuery("select count(displaycalendar) as count from Series where displaycalendar like 0").then(function(result) {
                    $scope.statistics.push({
                        name: "DB Series Hidden From Calendar",
                        data: result.next().row.count
                    });
                });
            };

            // Get sync stats
            // Unused
            var getSyncTime = function() {
                /*
                 * if sync is supported get the synctime else indicate not available
                 */
                if (StorageSyncService.isSupported()) {
                    StorageSyncService.get('lastSync').then(function(syncTime) {
                        if (syncTime !== null) {
                            $scope.statistics.push({
                                name: 'Storage Sync Last Synced on',
                                data: new Date(syncTime).toGMTString()
                            });
                        } else {
                            $scope.statistics.push({
                                name: 'Storage Sync has',
                                data: 'Never Signed in to Google'
                            });
                        }
                    });
                } else {
                    $scope.statistics.push({
                        name: 'Storage Sync is',
                        data: 'Not Available'
                    });
                }
            };

            // Get current torrent mirror
            var activeTorrentingMirror = 'n/a';
            if (SettingsService.get('torrenting.enabled')) {
                activeTorrentingMirror = ('config' in TorrentSearchEngines.getDefaultEngine() && 'mirror' in TorrentSearchEngines.getDefaultEngine().config) ? TorrentSearchEngines.getDefaultEngine().config.mirror : 'n/a';
            }

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

            // nwjs and chromium for standalone versions
            if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1)) {
                $scope.statistics.unshift({
                    name: 'NWJS, Chromium',
                    data: process.versions['node-webkit'] + ' , ' + process.versions['chromium']
                });
            };

            // DuckieTV version
            if ('chrome' in window && 'app' in window.chrome && 'getDetails' in window.chrome.app && window.chrome.app.getDetails() !== null && 'version' in window.chrome.app.getDetails()) {
                $scope.statistics.unshift({
                    name: window.chrome.app.getDetails().name,
                    data: window.chrome.app.getDetails().version
                });
            } else {
                $http.get('VERSION').then(function(data, status, headers, config) {
                    $scope.statistics.unshift({
                        name: 'DuckieTV Web Based',
                        data: data.data
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
                }
            });
            $scope.statistics.push({
                name: 'User Preferences on Local Storage',
                data: angular.toJson(userPrefs, true)
            });

            // dump local storage with exceptions to avoid overload.
            var dumpLocalStorage = JSON.parse(JSON.stringify(localStorage)); 
            ['userPreferences','torrenting.hashList','trakttv.token','trakttv.trending.cache','alarms','xem.mappings','snr.name-exceptions','snr.date-exceptions'].map(function(key) { delete dumpLocalStorage[key]; });
            $scope.statistics.push({
                name: 'Other significant Local Storage keys', 
                data: angular.toJson(dumpLocalStorage, true)
            });

        };
        getStats();
    }
]);
