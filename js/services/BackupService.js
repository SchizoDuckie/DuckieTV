/**
 * BackupService is injected whenever a backup is requested
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
 *          "displaycalendar": 1||0,
 *          "autoDownload": 1||0,
 *          "customSearchString": <string>||null,
 *          "ignoreGlobalQuality": 1||0,
 *          "ignoreGlobalIncludes": 1||0,
 *          "ignoreGlobalExcludes": 1||0,
 *          "searchProvider": <string>||null,
 *          "ignoreHideSpecials": 1||0,
 *          "customSearchSizeMin": <integer>||null,
 *          "customSearchSizeMax": <integer>||null,
 *          "dlPath": <string>||null,
 *          "customDelay": <integer>||null,
 *          "alias": <string>||null,
 *          "customFormat": <string>||null,
 *      },
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
DuckieTV.service('BackupService', ["TorrentSearchEngines", function(TorrentSearchEngines) {

    var service = {
        createBackup: function() {
            // Fetch all the series
            return CRUD.executeQuery('select Series.TVDB_ID, Series.displaycalendar, Series.autoDownload, Series.customSearchString, Series.ignoreGlobalQuality, Series.ignoreGlobalIncludes, Series.ignoreGlobalExcludes, Series.searchProvider, Series.ignoreHideSpecials, Series.customSearchSizeMin, Series.customSearchSizeMax, Series.dlPath, Series.customDelay, Series.alias, Series.customFormat from Series').then(function(series) {
                var out = {
                    settings: {},
                    series: {}
                };
                /*
                 * grab Jackett from cache and convert into pseudo localStorage for saving into the backup's _settings_ section
                 * this allows us to maintain backward compatibility with older DuckieTV versions
                 */
                out.settings['jackett'] = JSON.stringify(TorrentSearchEngines.jackettCache);
                // Store all the settings
                for (var i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i) == 'jackett') continue;
                    if (localStorage.key(i).indexOf('database.version') > -1) continue;
                    if (localStorage.key(i).indexOf('trakttv.trending.cache') > -1) continue;
                    if (localStorage.key(i).indexOf('trakttv.lastupdated.trending') > -1) continue;
                    out.settings[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
                }
                // Store all the series
                series.rows.map(function(serie) {
                    out.series[serie.TVDB_ID] = [];
                    out.series[serie.TVDB_ID].push({
                        'displaycalendar': serie.displaycalendar || 0,
                        'autoDownload': serie.autoDownload || 0,
                        'customSearchString': serie.customSearchString,
                        'ignoreGlobalQuality': serie.ignoreGlobalQuality,
                        'ignoreGlobalIncludes': serie.ignoreGlobalIncludes,
                        'ignoreGlobalExcludes': serie.ignoreGlobalExcludes,
                        'searchProvider': serie.searchProvider,
                        'ignoreHideSpecials': serie.ignoreHideSpecials,
                        'customSearchSizeMin': serie.customSearchSizeMin,
                        'customSearchSizeMax': serie.customSearchSizeMax,
                        'dlPath': serie.dlPath,
                        'customDelay': serie.customDelay,
                        'alias': serie.alias,
                        'customFormat': serie.customFormat
                    })
                });
                // Store watched episodes for each serie
                return CRUD.executeQuery('select Series.TVDB_ID, Episodes.TVDB_ID as epTVDB_ID, Episodes.watchedAt, Episodes.downloaded from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.downloaded == 1 or  Episodes.watchedAt is not null').then(function(res) {
                    res.rows.map(function(row) {
                        var watchedAt = (row.watchedAt) ? new Date(row.watchedAt).getTime() : null;
                        out.series[row.TVDB_ID].push({
                            'TVDB_ID': row.epTVDB_ID,
                            'watchedAt': watchedAt,
                            'downloaded': row.downloaded
                        })
                    });
                    var blob = new Blob([angular.toJson(out, true)], {
                        type: 'text/json'
                    });
                    return blob;
                })
            })
        }
    };
    return service;
}])

/**
 * at start-up set up a timer for the autoBackup
 */
.run(["BackupService", "SettingsService", "FavoritesService", "dialogs",
    function(BackupService, SettingsService, FavoritesService, dialogs) {
        /*
         * creates timer to schedule an autoBackup
         */
        var scheduleAutoBackup = function() {
            setTimeout(function() {
                // wait for FavoritesService to be available
                if (FavoritesService.initialized == true) {
                    // only do the backup if there are shows in favorites.
                    if (FavoritesService.favoriteIDs.length !== 0) {
                        if (timeToNextBackup == 60000) {
                            console.info('Scheduled autoBackup run at ', new Date());
                            dialogs.create('templates/dialogs/backup.html', 'backupDialogCtrl', {}, {
                                size: 'lg'
                            });
                        }
                    } else {
                        console.info('autoBackup is not required as there are no shows in favourites yet.');
                    }
                } else {
                    setTimeout(function() {
                        scheduleAutoBackup();
                    }, 1000);
                }
            }, timeToNextBackup);
        };

        var autoBackupPeriod = SettingsService.get('autobackup.period');
        if (autoBackupPeriod === 'never') {
            console.warn('autoBackup is set to never be scheduled');
            return; // autoBackup is not requested
        }
        // init last run time if not defined
        var localDT = new Date().getTime();
        if (!localStorage.getItem('autobackup.lastrun')) {
            localStorage.setItem('autobackup.lastrun', localDT);
        }
        // determine next run time
        var lastRun = new Date(parseInt(localStorage.getItem('autobackup.lastrun')));
        var nextBackupDT = null;
        switch (autoBackupPeriod) {
            case 'daily':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 1, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                break;
            case 'weekly':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 7, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                break;
            case 'monthly':
                nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth() + 1, lastRun.getDate(), lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime();
                break;
            default:
                console.error('unexpected autoBackupPeriod', autoBackupPeriod);
        }
        // schedule the timer for the next backup
        var timeToNextBackup = (nextBackupDT - localDT);
        if (timeToNextBackup > 0) {
            console.info('The next autoBackup is scheduled for', new Date(parseInt(nextBackupDT)));
        } else {
            timeToNextBackup = 60000; // the auto-backup will be started in a minute, to allow for start-up processes to complete.
        }
        scheduleAutoBackup();
    }
])