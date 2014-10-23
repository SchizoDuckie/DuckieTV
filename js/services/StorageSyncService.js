angular.module('DuckieTV.providers.storagesync', ['DuckieTV.providers.settings'])

/** 
 * The StorageSyncService provides synchronized storage to chrome's chrome.storage.sync api.
 * Chrome.storage.sync is called whenever the preference is enabled and stores the current favorite
 * list of series in the cloud.
 * On on other computers you've signed in on, the list of series is fetched and added.
 * When a remote deletion conflict is detected, the user is required to confirm deletion, otherwise the show
 * will be re-added.
 *
 * Note adding shows should happen in the background thread instead of in the current thread for the reason
 * that a user can close or navigate away from the current DuckieTV tab while the addToFavorites promise is
 * still running.
 */
.factory('StorageSyncService', function($rootScope, $q, FavoritesService, ChromePermissions, SettingsService, TraktTV, $injector, $filter) {

    var service = {

        isSyncing: false, // syncing is currently in progress
        firstRun: false, // first run?
        lastSynced: null, // timestamp when sync has last run
        activeDlg: null, // instance handle to an active question dialog to prevent multiple questions asked at the same time.
        wipeMode: false,
        /** 
         * Fetch the list of tvdb id's from the FavoritesService
         * @returns array of TVDB_ID's
         */
        getSeriesList: function() {
            return FavoritesService.getSeries().then(function(series) {
                return $q.all(series.map(function(el) {
                    return el.TVDB_ID;
                })).then(function(series) {
                    return series;
                });
            });
        },

        /** 
         * Execute a sync (write) step if syncing is not currently already in progress
         */
        synchronize: function() {
            ChromePermissions.checkGranted('storage').then(function() {
                if (SettingsService.get('storage.sync')) {
                    console.log("Storage sync can run!");
                    if (!service.isSyncing) {
                        service.isSyncing = true;
                        console.log("[Storage.Synchronize] Syncing storage!");
                        service.getSeriesList().then(function(series) {
                            service.set('series', series);
                            var time = new Date().getTime();
                            service.set('lastSync', time);
                            SettingsService.set('lastSync', time);
                            service.isSyncing = false;
                            console.info("Storage sync Series list completed at", time);
                        });
                    }
                }
            });

        },

        /** 
         * Read from synced storage
         * Fetches the local list of series and fetches the remote list of series.
         * Compares the 2 to add shows that do not exist locally and remove shows that do exist locally but not remote
         * Remote deletion requires the user to confirm the deletion.
         */
        read: function(lastSync) {
            console.info("Start sync progress!");
            if (service.isSyncing) {
                console.info("Sync already started!, cancelling");
                return;
            }

            service.get('series').then(function(storedSeries) {
                if (storedSeries === null) {
                    console.info("No series found in storage! syncing local series list!");
                    service.firstRun = true;
                    service.isSyncing = true;
                    //return service.synchronize(); // break the process and store the local series list
                }
                console.log("Fetched synced storage series: ", storedSeries);
                var existingSeries = service.getSeriesList().then(function(existingSeries) {
                    service.isSyncing = true;
                    var nonLocal = storedSeries === null ? [] : storedSeries.filter(function(el) {
                        return existingSeries.indexOf(el) == -1;
                    });

                    var nonRemote = storedSeries === null ? existingSeries : existingSeries.filter(function(id) {
                        return storedSeries.filter(function(id2) {
                            return (id == id2);
                        }).length === 0;
                    });

                    console.log("Found non-local series to synchronize", nonLocal);
                    console.log("Found non-remote series to delete", nonRemote);

                    $q.all(nonLocal.map(function(TVDB_ID) {
                        return TraktTV.enableBatchMode().findSerieByTVDBID(TVDB_ID).then(function(result) {
                            return FavoritesService.addFavorite(result).then(function() {
                                if (chrome.extension.getBackgroundPage() === window) {
                                    $rootScope.$broadcast('storage:hassynced', {}); // notify a possible foreground page listening of changes
                                }
                                return;
                            });
                        }, function(error) {
                            console.error("Error finding serie by tvdbid on trakt!", error);
                        });
                    })).then(function(series) {
                        console.log("Storagesyncservice read done, Added to favorites!", series);
                        service.isSyncing = false;
                        service.firstRun = false;
                        service.synchronize();
                    }, function(error) {
                        console.error("Error while syncing!", error);
                        service.isSyncing = false;
                    });
                });
            });
        },

        /** 
         * Verify if the syncing process is done.
         * The syncing process iterates the local and remote differences in the background.js and the active page.
         * The active page is used to show the user a confirmation dialog when we need to confirm deletion of a remote series
         * When all is iterated, synchronize the new list.
         */
        checkSyncProgress: function(progress) {
            console.info("Check sync progress! ", progress);



            if (!progress || service.activeDlg !== null) return;

            // if we're in the background page, process the additions

            // if we're in the background page and done processing local additions, notify foreground page when active

            // if we're in the foreground window and there's stuff to do, show the deletion dialogs.
            else if (chrome.extension.getBackgroundPage() !== window && progress.localProcessed == progress.nonLocal.length && progress.remoteProcessed < progress.nonRemote.length) {
                service.processRemoteDeletions(progress);
            }
            // otherwise, sync is done. Store this as the last synced state so the remotes can sync to that.
            else if (progress.localProcessed == progress.nonLocal.length && progress.remoteProcessed == progress.nonRemote.length) {
                SettingsService.set('sync.progress', null);
                service.synchronize();
            }
        },

        /**
         * Check if there are non-remote series to process.
         * This means that a list of all the series that do not exist on the remote sync system are iterated.
         * A question is asked on if you want to delete this serie locally too.
         * If confirmed, the counter of processed items is updated and the serie is deleted.
         * If not confirmed, the counter is updated and the nothing happens to this serie
         * After each step, check if we are done syncing (this means processing both local series in the background thread and local in the foreground page)
         * If we're done, push the new current state to the storage sync.
         */
        processRemoteDeletions: function(progress) {
            console.log("processing remote deletions: ", progress);
            if (!service.isSupported()) return;
            if (!progress) return;
            console.log("iterating non remote", progress);
            var confirmDelete = function(btn, result) {
                if (btn == 'yes-all') {
                    window.confirmAll = true;
                }
                FavoritesService.remove(result.asObject());
                progress.remoteProcessed++;
                service.activeDlg = null;
                service.checkSyncProgress(progress);
            };

            var cancelDelete = function(btn) {
                if (btn == 'no-all') {
                    window.confirmNone = true;
                }
                service.activeDlg = null;
                progress.remoteProcessed++;
                service.checkSyncProgress(progress);
            };

            FavoritesService.getById(progress.nonRemote[progress.remoteProcessed]).then(function(result) {
                if (('confirmAll' in window)) {
                    return confirmDelete('yes-all', result);
                } else if (('confirmNone' in window)) {
                    return cancelDelete('no-all');
                } else {
                    console.log("Fetched information for ", result.get('seriesname'), 'removing from favorites!');
                    service.activeDlg = $injector.get('$dialogs').confirmAll($filter('translate')('STORAGESYNCSERVICEjs/serie-deleted/hdr'),
                        $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p1') + '<strong>' +
                        result.get('name') + '</strong>' +
                        $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p2')
                    );
                    service.activeDlg.result.then(function(btn) {
                        confirmDelete(btn, result);
                    }, function() {
                        cancelDelete(btn);
                    });
                }
            });

        },

        /** 
         * Fetch a value from the storage.sync api.
         */
        get: function(key) {
            return $q(function(resolve, reject) {
                chrome.storage.sync.get(key, function(setting) {
                    console.info("Read storage.sync setting: ", key, setting);
                    (key in setting) ? resolve(setting[key].value) : resolve(null);
                });
            });
        },

        /** 
         * Entry point for chrome permissions
         */
        isSupported: function() {
            return ChromePermissions.isSupported();
        },


        /**
         * Store a new value in the storage.sync api
         */
        set: function(key, value) {
            var setting = {
                lastUpdated: new Date().getTime(),
                value: value
            };
            var prop = {};
            prop[key] = setting;
            chrome.storage.sync.set(prop, function() {
                console.log("Saved storage.sync setting: ", key, setting);
            });
        },

        enable: function() {
            return ChromePermissions.requestPermission('storage');
        },

        disable: function() {
            return ChromePermissions.revokePermission('storage');
        },

        wipe: function() {
            service.wipeMode = true;
            chrome.storage.sync.clear(function() {
                console.log("Chrome storage wiped.");
                service.wipeMode = false;
            });
        },

        /**
         * Attach background page sync event
         */
        attach: function() {
            ChromePermissions.checkGranted('storage').then(function() {
                if (SettingsService.get('storage.sync')) {
                    console.log("Attaching chrome storage change handler!");
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
                    service.read(); /** do initial fetch */
                }
            });
        },

        /**
         * Foreground thread update handler
         */
        initialize: function(forceCheck) {
            ChromePermissions.checkGranted('storage').then(function() {
                if (SettingsService.get('storage.sync')) {
                    $rootScope.$on('sync:processremoteupdate', function(event, progress) {
                        console.log("Process storagesync remote updates!", progress);

                        FavoritesService.restore(); // message the favoritesservice something has changed and it needs to refresh.
                        //service.checkSyncProgress(progress);
                    });

                    /** 
                     * Forward an event to the storagesync service when it's not already syncing.
                     * This make sure that local additions / deletions get stored in the cloud.
                     */
                    $rootScope.$on('storage:update', function() {
                        console.info("Received storage:update, writing new series list to cloud storage!");
                        if (!service.isSyncing) {
                            service.synchronize();
                        }
                    });
                }
            });
        }
    };
    return service;
});