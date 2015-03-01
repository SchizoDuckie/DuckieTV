DuckieTV.factory('ChromeStorageSyncTarget', ["SettingsService", "StorageSyncService", "ChromePermissions", "$injector", "$q",
    function(SettingsService, StorageSyncService, ChromePermissions, $injector, $q) {

        var service = {
            name: 'Chrome Storage Sync Target',
            lastSync: 'never',
            status: 'idle',
            statusMessage: '',
            series: [],
            nonRemote: [],
            nonLocal: [],

            enable: function() {
                SettingsService.set('Chrome.Sync', true);
                return ChromePermissions.requestPermission('storage');
            },
            disable: function() {
                SettingsService.set('Chrome.Sync', false);
                return ChromePermissions.revokePermission('storage');
            },
            isEnabled: function() {
                return SettingsService.get('Chrome.Sync');
            },
            isPermissionGranted: function() {
                return ChromePermissions.checkGranted('storage');
            },
            getSeriesList: function() {
                return service.get('series').then(function(series) {
                    return series ? series.map(function(el) {
                        return parseInt(el);
                    }) : [];
                });
            },
            /** 
             * Entry point for chrome permissions
             */
            isSupported: function() {
                return ChromePermissions.isSupported();
            },
            wipe: function() {
                service.wipeMode = true;
                chrome.storage.sync.clear(function() {
                    console.log("Chrome storage wiped.");
                    service.wipeMode = false;
                });
            },
            /** 
             * Fetch a value from the storage.sync api.
             */
            get: function(key) {
                return service.isPermissionGranted().then(function() {
                    return $q(function(resolve, reject) {
                        chrome.storage.sync.get(key, function(setting) {

                            console.info("Read storage.sync setting: ", key, setting);
                            (key in setting) ? resolve(setting[key].value) : resolve(null);
                        });
                    }, function() {
                        console.log("No permission to fetch storage sync key", key);
                        return null;
                    });
                });
            },
            /**
             * Store a new value in the storage.sync api
             */
            set: function(key, value) {
                return service.isPermissionGranted().then(function() {
                    var setting = {
                        lastUpdated: new Date().getTime(),
                        value: value
                    };
                    var prop = {};
                    service.get(key).then(function(oldValue) {
                        if (oldValue != value) {
                            prop[key] = setting;
                            chrome.storage.sync.set(prop, function() {
                                console.log("Saved storage.sync setting: ", key, setting);
                            });
                        } else {
                            console.info("Storage key", key, " set not executed because it's already at ", value);
                        }
                    });
                }, function() {
                    console.log('Storage permissions not granted, cannot set ', key, 'to', value);
                    return false;
                });
            },
            /**
             * Attach background page sync event
             */
            attach: function() {
                ChromePermissions.checkGranted('storage').then(function() {
                    chrome.storage.onChanged.addListener(function(changes, namespace) {
                        if (service.wipeMode) {
                            console.log("Service in wipemode, ignoring changes: ", changes, namespace);
                            return;
                        }
                        Object.keys(changes).map(function(key) {
                            if (changes[key].oldValue && !changes[key].newValue) {
                                var restore = {};
                                restore[key] = changes[key].oldValue;
                                chrome.storage.sync.set(restore, function() {
                                    console.warn("Re-added property ", key, " to ", changes[key].oldValue, "after it was wiped remotely (CROME BUG?!)");
                                });
                            }
                        });
                    });

                });
            },
            write: function() {
                service.set(tvdb, watchedList[tvdb]);
            },
            initialize: function() {
                ChromePermissions.checkGranted('storage').then(function() {
                    service.read();
                    //service.set('series', series);
                });
            }
        };

        console.info("ChromeStorageSyncTarget initialized");
        return service;
    }
]);

if ('chrome' in window && 'storage' in window.chrome && 'sync' in chrome.storage) {
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
            angular.element(document.body).injector().get('StorageSyncService').registerTarget('ChromeStorageSyncTarget');
        }, 500);
    });
}