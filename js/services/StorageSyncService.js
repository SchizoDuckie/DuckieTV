angular.module('DuckieTV.providers.storagesync', ['dialogs'])

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
.factory('StorageSyncService', function($rootScope, $q, FavoritesService, TraktTV, $dialogs, $filter) {
    var service = {

        isSyncing: false, // syncing is currently in progress
        lastSynced: null, // timestamp when sync has last run

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

            if (!service.isSyncing) {
                service.isSyncing = true;
                console.log("[Storage.Synchronize] Syncing storage!");
                service.getSeriesList().then(function(series) {
                    console.log("Storage sync Series list: ", series);
                    service.set('series', series);
                    service.set('synctime', new Date().getTime());
                    service.isSyncing = false;
                });
            }
        },

        /** 
         * Read from synced storage
         * Fetches the local list of series and fetches the remote list of series.
         * Compares the 2 to add shows that do not exist locally and remove shows that do exist locally but not remote
         * Remote deletion requires the user to confirm the deletion.
         */
        read: function(lastSync) {
            console.log("Reading synced storage since ", lastSync);
            service.get('series').then(function(results) {
                console.log("Fetched synced storage series: ", results);
                var existingSeries = service.getSeriesList().then(function(existingSeries) {
                    console.log("existing series from sync: ", existingSeries, "local series: ", results);

                    var nonLocal = results.filter(function(el) {
                        return existingSeries.indexOf(el) == -1
                    });
                    var nonRemote = existingSeries.filter(function(id) {
                        return results.filter(function(id2) {
                            return (id == id2);
                        }).length == 0
                    });

                    console.log("Found non-local series to synchronize", nonLocal);
                    console.log("Found non-remote series to delete", nonRemote)
                    var pq = [];
                    // add the non-local series
                    for (var i = 0; i < nonLocal.length; i++) {
                        pq.push(TraktTV.findSerieByTVDBID(nonLocal[i]).then(function(result) {
                            console.log("Fetched information for ", result.title, 'adding to favorites!');
                            return FavoritesService.addFavorite(result);
                        }));
                    }
                    // delete series after confirmation
                    for (var j = 0; j < nonRemote.length; j++) {
                        FavoritesService.getById(nonRemote[j]).then(function(result) {
                            console.log("Fetched information for ", result.get('seriesname'), 'removing from favorites!');
                            var dlg = $dialogs.confirm($filter('translate')('SYNC/serie-deleted/hdr'),
                                $filter('translate')('SYNC/serie-deleted-remote-question/p1') + '<strong>' +
                                result.get('name') + '</strong>' +
                                $filter('translate')('SYNC/serie-deleted-remote-question/p2')
                            );
                            dlg.result.then(function(btn) {
                                FavoritesService.remove(result.asObject());
                            });
                        });
                    }
                    // sync the settings when all is done
                    $q.all(pq).then(function() {
                        console.log("All shows added and deleted. Syncing local settings now");
                        service.synchronize();
                    });
                });
            });
        },

        /** 
         * Fetch a value from the storage.sync api.
         */
        get: function(key) {
            var d = $q.defer();
            chrome.storage.sync.get(key, function(setting) {
                console.log("Read storage setting: ", key, setting);
                (key in setting) ? d.resolve(setting[key].value) : d.reject();
            });
            return d.promise;
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
        }
    }
    service.read();
    return service;
})