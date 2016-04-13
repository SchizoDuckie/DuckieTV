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
DuckieTV.controller('BackupCtrl', ["$rootScope", "$scope", "$filter", "$injector", "$q", "$state", "dialogs", "FileReader", "TraktTVv2", "SettingsService", "FavoritesService", "CalendarEvents",
    function($rootScope, $scope, $filter, $injector,  $q, $state, dialogs, FileReader, TraktTVv2, SettingsService, FavoritesService, CalendarEvents) {

        $scope.backupString = false;
        $scope.wipeBeforeImport = false;
        $scope.declined = false;
        $scope.series = [];

        // set up the auto-backup-period selection-options
        var translatedAutoBackupPeriodList = $filter('translate')('AUTOBACKUP').split(',');
        var englishAutoBackupPeriodList = "never|daily|weekly|monthly".split('|');
        $scope.autoBackupPeriod = SettingsService.get('autobackup.period');
        $scope.autoBackupSelect = [];
        for (var idx = 0; idx < englishAutoBackupPeriodList.length; idx++) {
            $scope.autoBackupSelect.push({'name': translatedAutoBackupPeriodList[idx], 'value': englishAutoBackupPeriodList[idx]});
        };

        /**
         * Select all series from the database in the format described above, serialize them as a data uri string
         * that's set up on the $scope.backupString, so that it can be used as a trigger for
         * <a ng-if="backupString" download="DuckieTV.backup" ng-href="{{ backupString }}">Backup ready! Click to download.</a>
         */

        $scope.createBackup = function() {
            $injector.get('BackupService').createBackup().then(function(backupString) {
                $scope.backupString = backupString;
                $scope.backupTime = new Date();
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
            var torrentingEnabled = SettingsService.get('torrenting.enabled'); // remember current torrenting setting
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
                    SettingsService.set('torrenting.enabled', torrentingEnabled); // restore torrenting setting to value prior to restore
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
            var dlg = dialogs.confirm($filter('translate')('COMMON/wipe/hdr'),
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
                    $injector.get('DuckietvReload').windowLocationReload();
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

        // save the auto-backup-period setting when changed via the autoBackupForm.
        $scope.$watch('autoBackupPeriod', function(newVal, oldVal) {
            if (newVal == oldVal) return;
            SettingsService.set('autobackup.period', newVal);
            $injector.get('DuckietvReload').windowLocationReload();
        });

    }
]);