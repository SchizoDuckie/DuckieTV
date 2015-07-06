/**
 * Handles creating and importing a backup.
 *
 * The backup format is a simple JSON file that has the following structure:
 *
 * {
 * "settings": {
 *   // serialized settings
 * },
 * "series": {
 *  <SHOW_TVDB_ID> : [ // array of objects
 *      {
 *          "TVDB_ID": <Episode_TVDB_ID>,
 *          "watchedAt": <timestamp watchedAt>||null,
 *          "downloaded": 1
 *      },
 *      // repeat
 *    ],
 *    // repeat
 *  }
 */
DuckieTV.controller('BackupCtrl', ["$rootScope", "$scope", "dialogs", "$filter", "FileReader", "TraktTVv2", "SettingsService", "FavoritesService", "CalendarEvents", "$q", "$state",
    function($rootScope, $scope, dialogs, $filter, FileReader, TraktTVv2, SettingsService, FavoritesService, CalendarEvents, $q, $state) {

        $scope.backupString = false;
        $scope.wipeBeforeImport = false;
        $scope.declined = false;
        $scope.series = [];

        /**
         * Select all series from the database in the format described above, serialize them as a data uri string
         * that's set up on the $scope.backupString, so that it can be used as a trigger for
         * <a ng-if="backupString" download="DuckieTV.backup" ng-href="{{ backupString }}">Backup ready! Click to download.</a>
         */
        $scope.createBackup = function() {
            $scope.backupTime = new Date();
            // Fetch all the series
            CRUD.executeQuery('select Series.TVDB_ID from Series').then(function(series) {
                var out = {
                    settings: {},
                    series: {}
                };
                // Store all the settings
                for (var i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).indexOf('database.version') > -1) continue;
                    if (localStorage.key(i).indexOf('trakttv.trending.cache') > -1) continue;
                    if (localStorage.key(i).indexOf('trakttv.lastupdated.trending') > -1) continue;
                    out.settings[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
                }
                // Store all the series
                while (serie = series.next()) {
                    out.series[serie.get('TVDB_ID')] = [];
                }

                // Store watched episodes for each serie
                CRUD.executeQuery('select Series.TVDB_ID, Episodes.TVDB_ID as epTVDB_ID, Episodes.watchedAt, Episodes.downloaded from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.downloaded == 1 or  Episodes.watchedAt is not null').then(function(res) {
                    while (row = res.next()) {
                        out.series[row.get('TVDB_ID')].push({
                            'TVDB_ID': row.get('epTVDB_ID'),
                            'watchedAt': new Date(row.get('watchedAt')).getTime(),
                            'downloaded': 1
                        })
                    }
                    var blob = new Blob([angular.toJson(out, true)], {
                        type: 'text/json'
                    });
                    $scope.backupString = URL.createObjectURL(blob);

                    $scope.$digest();
                });
            });
        }

        $scope.isAdded = function(tvdb_id) {
            return FavoritesService.isAdded(tvdb_id);
        };

        $scope.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };


        $scope.restore = function() {
            console.log("Import backup!", $scope);
            FavoritesService.flushAdding();
            $scope.series = [];
            if ($scope.wipeBeforeImport) {
                $scope.wipeDatabase();
            } else {
                importBackup();
            }
        }

        /**
         * Read the backup file and feed it to the FavoritesService to resolve and add.
         * The FavoritesService has a method to automagically import the watched episodes
         * (which is a bit hacky as it should be part of the import)
         */
        var importBackup = function() {
            FileReader.readAsText($scope.file, $scope)
                .then(function(result) {
                    result = angular.fromJson(result);
                    console.log("Backup read!", result);
                    angular.forEach(result.settings, function(value, key) {
                        if (key == 'utorrent.token') return; // skip utorrent auth token since it can be invalid.
                        localStorage.setItem(key, value);
                    });
                    SettingsService.restore();
                    SettingsService.set('autodownload.lastrun', new Date().getTime());
                    angular.forEach(result.series, function(watched, TVDB_ID) {
                        FavoritesService.adding(TVDB_ID);
                        return TraktTVv2.resolveTVDBID(TVDB_ID).then(function(searchResult) {
                            return TraktTVv2.serie(searchResult.slug_id);
                        }).then(function(serie) {
                            $scope.series.push(serie);
                            return FavoritesService.addFavorite(serie, watched);
                        }).then(function() {
                            FavoritesService.added(TVDB_ID);
                        });
                    }, function(err) {
                        console.error("ERROR!", err);
                        FavoritesService.added(TVDB_ID);
                        FavoritesService.addError(TVDB_ID, err);
                    });
                });
        }

        /**
         * Wipes the database of all series, seasons and episodes and removes all settings
         */
        $scope.wipeDatabase = function() {
            var dlg = dialogs.confirm($filter('translate')('BACKUPCTRLjs/wipe/hdr'),
                $filter('translate')('BACKUPCTRLjs/wipe/desc')
            );
            dlg.result.then(function(btn) {
                var db = CRUD.EntityManager.getAdapter().db;
                for (var i in localStorage) {
                    if (i.indexOf('database.version') == 0) continue;
                    if (i.indexOf('utorrent.token') == 0) continue;
                    localStorage.removeItem(i);
                };
                FavoritesService.favorites = [];
                FavoritesService.favoriteIDs = [];
                FavoritesService.flushAdding();
                CalendarEvents.clearCache();

                return Promise.all(['Series', 'Seasons', 'Episodes'].map(function(table) {
                    return db.execute('DELETE from ' + table + ' where 1').then(function(result) {
                        console.log("Database Deleted");
                        return true;
                    })
                })).then(function() {
                    importBackup();
                });
            }, function(btn) {
                $scope.declined = true;
            });
        };

        $scope.refreshDatabase = function() {
            FavoritesService.favorites.map(function(serie) {
                FavoritesService.adding(serie.TVDB_ID);
                return TraktTVv2.resolveTVDBID(serie.TVDB_ID).then(function(s) {
                    return TraktTVv2.serie(s.slug_id)
                }).then(function(s) {
                    return FavoritesService.addFavorite(s).then(function() {
                        $rootScope.$broadcast('storage:update');
                        FavoritesService.added(s.tvdb_id);
                    });
                }, function(err) {
                    console.error("Error adding show!", err);
                    FavoritesService.added(serie.TVDB_ID);
                    FavoritesService.addError(serie.TVDB_ID, err);
                });
            });
        }
    }
]);