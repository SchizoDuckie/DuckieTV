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
.factory('StorageSyncService', function($rootScope, $q, FavoritesService, SettingsService, $injector, $filter) {

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
                    return $q.when(CRUD.EntityManager.getAdapter().db.execute('select Series.TVDB_ID, Episodes.TVDB_ID as epTVDB_ID, Episodes.watchedAt from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.watchedAt is not null').then(function(res) {
                        var watchedList = {},
                            row;
                        series.map(function(TVDB_ID) {
                            watchedList[TVDB_ID] = {};
                        });
                        while (row = res.next()) {
                            var id = parseInt(row.get('TVDB_ID'), 10);
                            if (!(id in watchedList)) {
                                watchedList[id] = {};
                            }
                            watchedList[id][row.get('epTVDB_ID')] = new Date(row.get('watchedAt')).getTime();
                        }
                        return watchedList;
                    }));
                });
            });
        },

        /** 
         * Execute a sync (write) step if syncing is not currently already in progress
         */
        synchronize: function() {
            if (service.isSyncing) {
                console.info("Storage sync: Not synchronizing, already working.");
                return;
            }
            console.log("Storage sync: Starting sync process on registered target");
            $q.all(service.targets.map(function(target) {
                return target.sync(watchedList);
            }, function(err) {
                // an error occured during sync
                debugger;
            })).then(function() {
                SettingsService.set('lastSync', time);
                service.isSyncing = false;
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
            var activeDialogs = [];

            var showDeleteConfirmDialog = function(serie) {
                var dlg = $injector.get('$dialogs').confirmAll($filter('translate')('STORAGESYNCSERVICEjs/serie-deleted/hdr'),
                    $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p1') + '<strong>' +
                    serie.get('name') + '</strong>' +
                    $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p2')
                );

                var resolve = function(btn) {
                    delete activeDialogs[activeDialogs.indexOf([dlg, resolve, reject])];
                    FavoritesService.remove(serie.asObject());

                    if (btn == 'yes-all') {
                        activeDialogs.map(function(dialog) {
                            try {
                                dialog[0].dismiss();
                            } catch (e) {}
                            dialog[1]('yes');
                        });
                        activeDialogs = null;
                    }
                }
                var reject = function(btn) {
                    // returns only if the yes-all / no-all have been called.
                    if (!activeDialogs) return; // the dialogs interface sucks. Dismissing them manually causes a reject. (can't pass params).
                    delete activeDialogs[activeDialogs.indexOf([dlg, resolve, reject])];
                    console.log("Don't delete!", serie.asObject());
                    if (btn == 'no-all') {
                        activeDialogs.map(function(dialog) {
                            try {
                                dialog[0].dismiss();
                            } catch (e) {}
                        });
                        activeDialogs = null;
                        service.synchronize();
                    }
                }
                dlg.result.then(resolve, reject);

                activeDialogs.push([dlg, resolve, reject]);

            };

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

                    var nonRemote = storedSeries === null ? [] : existingSeries.filter(function(id) {
                        return storedSeries.filter(function(id2) {
                            return (id == id2);
                        }).length === 0;
                    });

                    console.log("Found non-local series to synchronize", nonLocal);
                    console.log("Found non-remote series to delete", nonRemote);

                    $q.all(nonLocal.map(function(TVDB_ID) {
                        return TraktTV.enableBatchMode().findSerieByTVDBID(TVDB_ID).then(function(serie) {
                            service.get(TVDB_ID.toString()).then(function(watched) {
                                console.log("Found watched items from storage sync!", watched);
                                debugger;
                                FavoritesService.addFavorite(serie, watched);
                            }).then(function() {
                                $rootScope.$broadcast('episodes:updated');
                            }).catch(function(error) {
                                console.error("Error finding serie by tvdbid on trakt!", error);
                            });
                        });
                    }), nonRemote.map(function(TVDB_ID) {
                        return FavoritesService.getById(TVDB_ID).then(showDeleteConfirmDialog);
                    })).then(function(remapped) {
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
         * Foreground thread update handler
         */
        initialize: function(forceCheck) {
            if (SettingsService.get('storage.sync')) {
                SyncManager.Synchronize();
            }
        }
    };
    return service;
});