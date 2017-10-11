/**
 * Handles creating and importing a backup.
 *
 * see app.js for the backup format structure description
 */
DuckieTV.controller('BackupCtrl', ["$rootScope", "$scope", "$filter", "BackupService", "$q", "$state", "dialogs", "FileReader", "TraktTVv2", "SettingsService", "FavoritesService", "CalendarEvents", "TorrentSearchEngines",
    function($rootScope, $scope, $filter, BackupService, $q, $state, dialogs, FileReader, TraktTVv2, SettingsService, FavoritesService, CalendarEvents, TorrentSearchEngines) {

        $scope.wipeBeforeImport = false;
        $scope.declined = false;
        $scope.completed = false;
        $scope.series = [];
        var backupCount = 0;
        var completedCount = 0;

        // set up the auto-backup-period selection-options
        var translatedAutoBackupPeriodList = $filter('translate')('AUTOBACKUPLIST').split('|');
        var englishAutoBackupPeriodList = "never|daily|weekly|monthly".split('|');
        $scope.autoBackupPeriod = SettingsService.get('autobackup.period');
        $scope.autoBackupSelect = [];
        for (var idx = 0; idx < englishAutoBackupPeriodList.length; idx++) {
            $scope.autoBackupSelect.push({
                'name': translatedAutoBackupPeriodList[idx],
                'value': englishAutoBackupPeriodList[idx]
            });
        };
        $scope.nextAutoBackupDate = '';
        // determine next run time
        var lastRun = new Date(parseInt(localStorage.getItem('autobackup.lastrun')));
        var nextBackupDT = null;
        switch ($scope.autoBackupPeriod) {
            case 'daily':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 1, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                $scope.nextAutoBackupDate = '' + new Date(parseInt(nextBackupDT));
                break;
            case 'weekly':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 7, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                $scope.nextAutoBackupDate = '' + new Date(parseInt(nextBackupDT));
                break;
            case 'monthly':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth() + 1, lastRun.getDate(), lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                $scope.nextAutoBackupDate = '' + new Date(parseInt(nextBackupDT));
                break;
            default:
        };

        /**
         * Create backup via download service and force the download.
         */
        $scope.createBackup = function() {
            BackupService.createBackup().then(function(backupString) {
                var filename = 'DuckieTV %s.backup'.replace('%s', $filter('date')(new Date(), 'shortDate'));
                download(backupString, filename, 'application/json');
            });
        };

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
                $scope.wipeDatabase('restore');
            } else {
                importBackup();
            }
        };

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
                    // save settings
                    angular.forEach(result.settings, function(value, key) {
                        if (key == 'utorrent.token') return; // skip utorrent auth token since it can be invalid.
                        /*
                         * process psuedo localStorage _jackett_ in backup's _settings_ 
                         */
                        if (key == 'jackett') {
                            fillJackett = function(jackett, data) {
                                jackett.name = data.name;
                                jackett.torznab = data.torznab;
                                jackett.enabled = data.enabled;
                                jackett.torznabEnabled = data.torznabEnabled;
                                jackett.apiKey = data.apiKey;
                                jackett.json = data.json;
                            };
                            var importedJackett = JSON.parse(value);
                            importedJackett.map(function(data) {
                                var jackett = TorrentSearchEngines.getJackettFromCache(data.name) || new Jackett();
                                fillJackett(jackett, data);
                                jackett.Persist().then(function(){
                                    TorrentSearchEngines.removeJackettFromCache(jackett.name);
                                    TorrentSearchEngines.addJackettEngine(jackett);
                                });
                            });
                            return;
                        }
                        localStorage.setItem(key, value);
                    });
                    SettingsService.restore();
                    // schedule the next auto-backup after the import in a days time.
                    var localDT = new Date();
                    var nextBackupDT = new Date(localDT.getFullYear(), localDT.getMonth(), localDT.getDate() + 1, localDT.getHours(), localDT.getMinutes(), localDT.getSeconds()).getTime();
                    localStorage.setItem('autobackup.lastrun', nextBackupDT);
                    // adjust other settings
                    SettingsService.set('autodownload.lastrun', new Date().getTime());
                    SettingsService.set('torrenting.enabled', torrentingEnabled); // restore torrenting setting to value prior to restore
                    // save series/seasons/episodes
                    angular.forEach(result.series, function(data, TVDB_ID) {
                        FavoritesService.adding(TVDB_ID);
                        backupCount++;
                        return TraktTVv2.resolveTVDBID(TVDB_ID).then(function(searchResult) {
                            return TraktTVv2.serie(searchResult.slug_id);
                        }).then(function(serie) {
                            $scope.series.push(serie);
                            return FavoritesService.addFavorite(serie, data);
                        }).then(function() {
                            // save series custom settings
                            CRUD.FindOne('Serie', {
                                'TVDB_ID': TVDB_ID
                            }).then(function(serie) {
                                if (!serie) {
                                    console.warn("Series by TVDB_ID %s not found.", TVDB_ID);
                                } else {
                                    // are we dealing with a pre-1.1.4 backup?
                                    if (data.length > 0) {
                                        if ('TVDB_ID' in data[0]) {
                                            // this is a pre 1.1.4 backup, skip it
                                        } else {
                                            // this is a 1.1.4 or newer backup, process the series custom settings
                                            serie = angular.extend(serie, data[0]);
                                            serie.Persist();
                                        }
                                    }
                                };
                            });
                            FavoritesService.added(TVDB_ID);
                            completedCount++;
                            $scope.completed = (backupCount == completedCount);
                        });
                    }, function(err) {
                        console.error("ERROR!", err);
                        FavoritesService.added(TVDB_ID);
                        FavoritesService.addError(TVDB_ID, err);
                        completedCount++;
                    });
                });
        };

        /**
         * Wipes the database of all series, seasons and episodes and removes all settings
         */
        $scope.wipeDatabase = function(isRestoring) {
            if (!isRestoring) {
                isRestoring = 'N';
            };
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

                return Promise.all(['Series', 'Seasons', 'Episodes', 'Jackett'].map(function(table) {
                    return db.execute('DELETE from ' + table + ' where 1').then(function(result) {
                        console.log("Database Deleted");
                        return true;
                    })
                })).then(function() {
                    if (isRestoring == 'N') {
                        window.location.reload();
                    } else {
                        importBackup();
                    }
                });
            }, function(btn) {
                $scope.declined = true;
            });
        };

        $scope.refreshDatabase = function() {
            FavoritesService.favorites.map(function(serie) {
                FavoritesService.adding(serie.TVDB_ID);
                return TraktTVv2.serie(serie.TRAKT_ID).then(function(s) {
                    return FavoritesService.addFavorite(s, undefined, true, true).then(function() {
                        $rootScope.$broadcast('storage:update');
                        FavoritesService.added(s.tvdb_id);
                    });
                }, function(err) {
                    console.error("Error adding show!", err);
                    FavoritesService.added(serie.TVDB_ID);
                    FavoritesService.addError(serie.TVDB_ID, err);
                });
            });
        };

        // save the auto-backup-period setting when changed via the autoBackupForm.
        $scope.$watch('autoBackupPeriod', function(newVal, oldVal) {
            if (newVal == oldVal) return;
            SettingsService.set('autobackup.period', newVal);
            window.location.reload();
        });

    }
]);