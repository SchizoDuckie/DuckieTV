/**
 * Fetches and displays various statistics about current DuckieTV Setup on About Page
 */
DuckieTV.controller('AboutCtrl', ["$scope", "$rootScope", "$q", "$http", "$filter", "$injector", "SettingsService", "StorageSyncService", "GenericSearch",
    function($scope, $rootScope, $q, $http, $filter, $injector, SettingsService, StorageSyncService, GenericSearch) {

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
            var activeTorrentingMirror = GenericSearch.getConfig().mirror;

            // Get date of last trakt update
            var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')));

            // General misc stats
            $scope.statistics = [{
                name: 'UserAgent',
                data: navigator.userAgent
            }, {
                name: 'Platform',
                data: navigator.platform
            }, {
                name: 'Vendor',
                data: navigator.vendor
            }, {
                name: 'Determined Locale',
                data: SettingsService.get('client.determinedlocale') || 'n/a'
            }, {
                name: 'Active Locale',
                data: SettingsService.get('application.locale')
            }, {
                name: 'Active Language',
                data: SettingsService.get('application.language')
            }, {
                name: 'Screen (width x height)',
                data: screenSize
            }, {
                name: 'ChromeCast Supported',
                data: SettingsService.get('cast.supported')
            }, {
                name: 'Torrenting Enabled',
                data: SettingsService.get('torrenting.enabled')
            }, {
                name: 'Torrenting Search Provider',
                data: SettingsService.get('torrenting.searchprovider')
            }, {
                name: 'Torrenting URL',
                data: activeTorrentingMirror
            }, {
                name: 'Torrenting Auto-Download Active',
                data: SettingsService.get('torrenting.autodownload')
            }, {
                name: 'TraktTV Sync Enabled',
                data: SettingsService.get('trakttv.sync')
            }, {
                name: 'Storage Sync Enabled',
                data: SettingsService.get('storage.sync')
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
        }
        getStats();
    }
]);