DuckieTV.factory('SyncManager', function() {
    /*
    targets: [],

    registerTarget

    addTask

    isSyncing

    var showDeleteConfirmDialog = function(serie) {
        var dlg = $injector.get('dialogs').confirmAll($filter('translate')('STORAGESYNCSERVICEjs/serie-deleted/hdr'),
            $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p1') + '<strong>' +
            serie.get('name') + '</strong>' +
            $filter('translate')('STORAGESYNCSERVICEjs/serie-deleted-remote-question/p2')
        );

        var resolve = function(btn) {
            delete activeDialogs[activeDialogs.indexOf([dlg, resolve, reject])];
            FavoritesService.remove(serie);

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
            console.log("Don't delete!", serie);
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

    startSync: function(storedSeries) {

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
    return showDeleteConfirmDialog(FavoritesService.getById(TVDB_ID));
            })).then(function(remapped) {
                service.isSyncing = false;
                service.firstRun = false;
                service.synchronize();
            }, function(error) {
                console.error("Error while syncing!", error);
                service.isSyncing = false;
            });
        });
    }



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
        service.synchronize();
    });
})