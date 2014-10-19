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
.factory('StorageSyncService', function($rootScope, $q, FavoritesService, SettingsService, TraktTV, $injector, $filter) {
    function isSupported() {
        return ('chrome' in window && 'storage' in chrome && 'sync' in chrome.storage && navigator.vendor.indexOf('Opera') == -1) 
    };

    var service = {

        isSyncing: false, // syncing is currently in progress
        lastSynced: null, // timestamp when sync has last run
        activeDlg: null, // instance handle to an active question dialog to prevent multiple questions asked at the same time.

        /** 
         * Fetch the list of tvdb id's from the FavoritesService
         * @returns array of TVDB_ID's
         */ 
        getSeriesList: function() {
            var d = $q.defer();
            FavoritesService.getSeries().then(function(series) {
                d.resolve(series.map(function(el) {
                    return el.TVDB_ID;
                }));
            });
            return d.promise;
        },

        /** 
         * Execute a sync step if syncing is not currently already in progress
         */
        synchronize: function() {
            if(!isSupported()) return;
            //debugger;
            service.get('synctime').then(function(synctime) {
                //debugger;
                if((!synctime || !SettingsService.get('lastSync') || SettingsService.get('lastSync') > synctime) && !service.isSyncing) {
                    //debugger;
                    service.isSyncing = true;
                    console.log("[Storage.Synchronize] Syncing storage!");
                    service.getSeriesList().then(function(series) {
                        console.log("Storage sync Series list: ", series);
                        service.set('series', series);
                        var now = new Date().getTime();
                        service.set('synctime', now);
                        service.isSyncing = false;
                    });
                }
            })
        },

        /** 
         * Read from synced storage
         * Fetches the local list of series and fetches the remote list of series.
         * Compares the 2 to add shows that do not exist locally and remove shows that do exist locally but not remote
         * Remote deletion requires the user to confirm the deletion.
         */
        read: function(lastSync) {
            if(!isSupported() || service.isSyncing) return;
            console.log("Reading synced storage since ", new Date(lastSync), ' local last sync: ', new Date(SettingsService.get('lastSync')));

            if(lastSync < SettingsService.get('lastSync')) {
                console.log("Systems are in sync! nothing to do !");
                return; // systems are in sync, nothing to do.
            }
            
            service.get('series').then(function(results) {
                results = results || [];
                console.log("Fetched synced storage series: ", results);
                var existingSeries = service.getSeriesList().then(function(existingSeries) {
                    
                    var nonLocal = results.filter(function(el) {
                        return existingSeries.indexOf(el) == -1
                    });
                    var nonRemote = existingSeries.filter(function(id) {
                        return results.filter(function(id2) {
                            return (id == id2);
                        }).length == 0
                    });

                    console.log("Found non-local series to synchronize", nonLocal);
                    console.log("Found non-remote series to delete", nonRemote);

                    service.checkSyncProgress({ // fire off the background and foreground deletion checks.
                        'nonLocal': nonLocal,
                        'nonRemote': nonRemote,
                        'localProcessed': 0,
                        'remoteProcessed': 0
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

            if(progress === true) {
                return service.read(0);
            }

            if(!progress || service.activeDlg !== null) return;
            SettingsService.set('sync.progress', progress);

            // if we're in the background page, process the additions
            if(chrome.extension.getBackgroundPage() === window && progress.localProcessed < progress.nonLocal.length) {
                service.processRemoteAdditions(progress);
            } 
            // if we're in the background page and done processing local additions, notify foreground page when active
            else if (chrome.extension.getBackgroundPage() === window && progress.localProcessed == progress.nonLocal.length) {
                $rootScope.$broadcast('storage:hassynced', progress); // notify a possible foreground page listening of changes
            }
            // if we're in the foreground window and there's stuff to do, show the deletion dialogs.
            else if(chrome.extension.getBackgroundPage() !== window && progress.localProcessed == progress.nonLocal.length && progress.remoteProcessed < progress.nonRemote.length) {
                service.processRemoteDeletions(progress);
            }
            // otherwise, sync is done. Store this as the last synced state so the remotes can sync to that.
            else if(progress.localProcessed == progress.nonLocal.length && progress.remoteProcessed == progress.nonRemote.length) {
                SettingsService.set('sync.progress', null);
                service.synchronize();
            }
        },

        processRemoteAdditions: function(progress) {
            if(progress && progress.localProcessed < progress.nonLocal.length) {
                TraktTV.findSerieByTVDBID(progress.nonLocal[progress.localProcessed]).then(function(result) {
                    console.log("Process remote addition: ", result.title, 'adding to favorites!');
                    FavoritesService.addFavorite(result).then(function() {
                            progress.localProcessed++;
                            service.checkSyncProgress(progress);
                    })
                });
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
            if(!isSupported()) return;
            if(!progress) return;
            console.log("iterating non remote", progress);
            var confirmDelete = function(btn, result) {
                if(btn == 'yes-all') {
                    window.confirmAll = true;
                }
                FavoritesService.remove(result.asObject());
                progress.remoteProcessed++;
                service.activeDlg = null;
                service.checkSyncProgress(progress);
            };

            var cancelDelete = function(btn) {
                if(btn == 'no-all') {
                    window.confirmNone = true;
                }
                service.activeDlg = null;
                progress.remoteProcessed++;
                service.checkSyncProgress(progress);
            }

            FavoritesService.getById(progress.nonRemote[progress.remoteProcessed]).then(function(result) {
                if(('confirmAll' in window)) {
                    return confirmDelete('yes-all', result)
                } else if (('confirmNone' in window)) {
                    return cancelDelete('no-all')
                } else {
                    console.log("Fetched information for ", result.get('seriesname'), 'removing from favorites!');
                    service.activeDlg = $injector.get('$dialogs').confirmAll($filter('translate')('STORAGESYNCSERVICEjs/serie-deleted/hdr'),
                        $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p1') + '<strong>' +
                        result.get('name') + '</strong>' +
                        $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p2')
                    );
                    service.activeDlg.result.then(function(btn) {
                        confirmDelete(btn, result)
                    }, function() {
                        cancelDelete(btn)
                    });
                }
            });
        
        },

        /** 
         * Fetch a value from the storage.sync api.
         */
        get: function(key) {
            var d = $q.defer();
            chrome.storage.sync.get(key, function(setting) {
                console.log("Read storage setting: ", key, setting);
                (key in setting) ? d.resolve(setting[key].value) : d.resolve(null);
            });
            return d.promise;
        },

        /** 
         * Public accessor for the global function
         */
        isSupported: function() {
            return isSupported();
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
                console.log("Synced storage setting: ", key, setting);
            });
        },

        attach: function() {
            console.log("Attaching chrome storage change handler!")
            chrome.storage.onChanged.addListener(function(changes, namespace) {
                Object.keys(changes).map(function(key) {
                    if(changes[key].oldValue && !changes[key].newValue) {
                        var restore = {};
                        restore[key] = changes[key].oldValue;
                        chrome.storage.sync.set( restore, function() { 
                            console.log("Re-added property ", key, " to ", changes[key].oldValue, "after it was wiped remotely!");
                        });
                    }
                })                
                if('synctime' in changes && 'newValue' in changes.synctime && SettingsService.get('lastSync') < changes.synctime.newValue.value) {
                    service.read(changes.synctime.newValue.value);
                }
            });
        }
    }
    return service;
})
