angular.module('DuckieTV.controllers.about', [])

.controller('AboutCtrl', function($scope, $rootScope, $q, $http, $filter, EventSchedulerService, SettingsService, StorageSyncService) {

    $scope.statistics = [];

    getStats = function() {

        // screen
        var screenSize = '';
        if (screen.width) {
            width = (screen.width) ? screen.width : '';
            height = (screen.height) ? screen.height : '';
            screenSize += '' + width + " x " + height;
        };

        // Timers
        countTimers = function() {
            EventSchedulerService.getAll().then(function(timers) {
                $scope.statistics.push({
                    name: 'Timers',
                    data: timers.length
                });
            });
        };

        // database statistics
        countEntity = function(entity) {
            CRUD.EntityManager.getAdapter().db.execute('select count(*) as count from ' + entity).then(function(result) {
                $scope.statistics.push({
                    name: "DB " + entity,
                    data: result.next().row.count
                });
            });
        };

        getSyncTime = function() {
            /*
             * if sync is supported get the synctime else indicate not available
             */
            if (StorageSyncService.isSupported()) {
                StorageSyncService.get('synctime').then(function(syncTime) {
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
        
        // fetch active torrenting mirror
        switch (SettingsService.get('torrenting.searchprovider')) {
            case 'ThePirateBay':
                var activeTorrentingMirror = SettingsService.get('thepiratebay.mirror');
                break;
            case 'KickassTorrents':
                var activeTorrentingMirror = SettingsService.get('kickasstorrents.mirror');
                break;
            case 'GenericSearch':
                var activeTorrentingMirror = 'https://torrentz.eu';
                break;
            default:
                var activeTorrentingMirror = 'Not Available';
        };
        
        // general statistics
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
            data: SettingsService.get('client.determinedlocale')
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
            name: 'TrakTV Sync Enabled',
             data: SettingsService.get('trakttv.sync')
        }, {
            name: 'Storage Sync Supported',
            data: StorageSyncService.isSupported()
        }, {
            name: 'Storage Sync Enabled',
            data: SettingsService.get('storage.sync')
        }];

        // DuckieTV version
        if ('chrome' in window && 'app' in window.chrome && 'getDetails' in chrome.app && 'version' in window.chrome.app.getDetails()) {
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

         // local date and time in GMT presentation
        $scope.statistics.unshift({
            name: 'Current Date and Time',
            data: new Date().toGMTString()
        });

        getSyncTime();
        countTimers();
        countEntity('Series');
        countEntity('Seasons');
        countEntity('Episodes');
        countEntity('EventSchedule');

    }
    getStats();
});