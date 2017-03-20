/**
 * Fetches and displays various statistics about current DuckieTV Setup on About Page
 */
DuckieTV.controller('AboutCtrl', ["$scope", "$rootScope", "$q", "$http", "$filter", "$injector", "SettingsService", "StorageSyncService", "TorrentSearchEngines", "DuckieTorrent", "AutoDownloadService",
    function($scope, $rootScope, $q, $http, $filter, $injector, SettingsService, StorageSyncService, TorrentSearchEngines, DuckieTorrent, AutoDownloadService) {

        $scope.showDevTools = function() {
            require('nw.gui').Window.get().showDevTools();
        }

        $scope.isNightly = navigator.userAgent.toLowerCase().indexOf('nightly') > -1;

        /**
         * Closes the SidePanel 
         */
        $scope.closeSidePanel = function() {
            $injector.get('$state').go('calendar');
        }

        $scope.isStandalone = SettingsService.isStandalone();

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
                window.location.reload();
            } else {
                localStorage.setItem('optin_error_reporting', true);
                localStorage.setItem('optin_error_reporting.start_time', new Date().getTime());
                window.location.reload();
            }
        };

        $scope.copyStatsToClipboard = function() {
            var clip = require('nw.gui').Clipboard.get();
            clip.set(angular.toJson($scope.statistics, true), 'text');
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
                        data: result.rows[0].count
                    });
                });
            };

            // Count shows hidden from calendar
            var countHiddenShows = function() {
                CRUD.executeQuery("select count(displaycalendar) as count from Series where displaycalendar like 0").then(function(result) {
                    $scope.statistics.push({
                        name: "DB Series Hidden From Calendar",
                        data: result.rows[0].count
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

            // Get default search engine and status
            var defaultSE = 'n/a';
            if (SettingsService.get('torrenting.enabled')) {
                defaultSE = TorrentSearchEngines.getDefault() + " (Enabled)";
            } else {
                defaultSE = SettingsService.get('torrenting.searchprovider') + " (Disabled)";
            }

            // Get default torrent client engine and connection to host status
            var defaultTC = 'n/a';
            if (SettingsService.get('torrenting.enabled')) {
                if (DuckieTorrent.getClient().isConnected()) {
                    defaultTC = DuckieTorrent.getClient().getName() + " (Enabled and Connected to Host)";
                } else {
                    defaultTC = DuckieTorrent.getClient().getName() + " (Enabled but Not Connected to Host)";
                }
            } else {
                defaultTC = SettingsService.get('torrenting.client') + " (Disabled)";
            }

            // Get auto download service  status
            var autoDL = 'n/a';
            if (SettingsService.get('torrenting.enabled') && SettingsService.get('torrenting.autodownload')) {
                if (AutoDownloadService.checkTimeout) {
                    autoDL = "(Enabled and Active)";
                } else {
                    autoDL = "(Enabled but Inactive)";
                }
            } else {
                autoDL = "(Disabled)";
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
                name: 'Default Search Engine',
                data: defaultSE
            }, {
                name: 'Default Torrent Client',
                data: defaultTC
            }, {
                name: 'Auto Download Service',
                data: autoDL
            }, {
                name: 'Last checked TraktTV for DB updates on',
                data: lastUpdated.toGMTString()
            }];

            // nwjs and chromium for standalone versions
            if ($scope.isStandalone) {
                $scope.statistics.unshift({
                    name: 'NWJS, Chromium',
                    data: process.versions['nw'] + ' , ' + process.versions['chromium']
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
            countEntity('Fanart');

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
            ['userPreferences', 'torrenting.hashList', 'trakttv.token', 'trakttv.trending.cache', 'trakttvtrending.cache', 'alarms', 'xem.mappings', 'snr.name-exceptions', 'snr.date-exceptions', 'fanart.cache'].map(function(key) {
                delete dumpLocalStorage[key];
            });
            $scope.statistics.push({
                name: 'Other significant Local Storage keys',
                data: JSON.stringify(dumpLocalStorage, null, "  ")
            });

        };
        getStats();
    }
]);