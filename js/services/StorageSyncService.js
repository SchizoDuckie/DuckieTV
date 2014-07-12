angular.module('DuckieTV.providers.storagesync', ['dialogs'])

.factory('StorageSyncService', function($rootScope, $q, FavoritesService, TraktTV, $dialogs, $filter) {
    var service = {

        isSyncing: false,
        isStarted: false,
        syncTarget: null,
        lastSynced: null,

        getSeriesList: function() {
            var d = $q.defer();
            FavoritesService.getSeries().then(function(series) {
                d.resolve(series.map(function(el) {
                    return el.TVDB_ID;
                }));
            })
            return d.promise;
        },

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

                    for (var i = 0; i < nonLocal.length; i++) {
                        pq.push(TraktTV.findSerieByTVDBID(nonLocal[i]).then(function(result) {
                            console.log("Fetched information for ", result.title, 'adding to favorites!');
                            return FavoritesService.addFavorite(result);
                        }));
                    }

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

                    $q.all(pq).then(function() {
                        console.log("All shows added and deleted. Syncing local settings now");
                        service.synchronize();
                    });
                });
            });
        },

        get: function(key) {
            var d = $q.defer();
            chrome.storage.sync.get(key, function(setting) {
                console.log("Read storage setting: ", key, setting);
                (key in setting) ? d.resolve(setting[key].value) : d.reject();
            });
            return d.promise;
        },

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