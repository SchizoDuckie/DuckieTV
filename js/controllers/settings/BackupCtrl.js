/**
 * Handles creating and importing a backup.
 *
 * see app.js for the backup format structure description
 */
DuckieTV.controller('BackupCtrl', ['$rootScope', '$scope', '$filter', 'BackupService', 'BackupCodec', 'dialogs', 'FileReader', 'TraktTVv2', 'SettingsService', 'FavoritesService', 'CalendarEvents', 'TorrentSearchEngines',
  function($rootScope, $scope, $filter, BackupService, BackupCodec, dialogs, FileReader, TraktTVv2, SettingsService, FavoritesService, CalendarEvents, TorrentSearchEngines) {
    $scope.wipeBeforeImport = false
    $scope.declined = false
    $scope.completed = false
    $scope.series = []
    var backupCount = 0
    var completedCount = 0

    // set up the auto-backup-period selection-options
    var translatedAutoBackupPeriodList = $filter('translate')('AUTOBACKUPLIST').split('|')
    var englishAutoBackupPeriodList = 'never|daily|weekly|monthly'.split('|')
    $scope.autoBackupPeriod = SettingsService.get('autobackup.period')
    $scope.autoBackupSelect = []
    for (var idx = 0; idx < englishAutoBackupPeriodList.length; idx++) {
      $scope.autoBackupSelect.push({
        'name': translatedAutoBackupPeriodList[idx],
        'value': englishAutoBackupPeriodList[idx]
      })
    }
    $scope.nextAutoBackupDate = ''
    // determine next run time
    var lastRun = new Date(parseInt(localStorage.getItem('autobackup.lastrun')))
    var nextBackupDT = null
    switch ($scope.autoBackupPeriod) {
      case 'daily':
        nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 1, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime()
        $scope.nextAutoBackupDate = '' + new Date(parseInt(nextBackupDT))
        break
      case 'weekly':
        nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 7, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime()
        $scope.nextAutoBackupDate = '' + new Date(parseInt(nextBackupDT))
        break
      case 'monthly':
        nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth() + 1, lastRun.getDate(), lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime()
        $scope.nextAutoBackupDate = '' + new Date(parseInt(nextBackupDT))
        break
      default:
    }

    /**
     * Create backup via download service and force the download.
     */
    $scope.createBackup = function() {
      BackupService.createBackup().then(function(backupString) {
        var filename = 'DuckieTV %s.backup'.replace('%s', $filter('date')(new Date(), 'shortDate'))
        download(backupString, filename, 'application/json')
      })
    }

    $scope.isAdded = function(TRAKTorTVDB_ID) {
      return FavoritesService.isAdded(TRAKTorTVDB_ID)
    }

    $scope.isAdding = function(TRAKTorTVDB_ID) {
      return FavoritesService.isAdding(TRAKTorTVDB_ID)
    }

    $scope.restore = function() {
      FavoritesService.flushAdding()
      $scope.series = []
      if ($scope.wipeBeforeImport) {
        $scope.wipeDatabase('restore')
      } else {
        importBackup()
      }
    }

    /**
     * Read the backup file and feed it to the FavoritesService to resolve and add.
     * The FavoritesService has a method to automagically import the watched episodes
     * (which is a bit hacky as it should be part of the import)
     */
    var importBackup = function() {
      var torrentingEnabled = SettingsService.get('torrenting.enabled') // remember current torrenting setting
      FileReader.readAsText($scope.file, $scope)
        .then(function(result) {
          return BackupCodec.normalize(result)
        })
        .then(function(plan) {
          console.log('Backup validated!', plan)

          var protectedSettings = ['utorrent.token', 'trakttv.token', 'trakttv.refresh_token']
          angular.forEach(plan.settings, function(value, key) {
            if (protectedSettings.indexOf(key) !== -1) return
            localStorage.setItem(key, value)
          })

          var jackettWrites = plan.jackett.map(function(data) {
            var jackett = TorrentSearchEngines.getJackettFromCache(data.name) || new Jackett()
            jackett.name = data.name
            jackett.torznab = data.torznab
            jackett.enabled = data.enabled
            jackett.torznabEnabled = data.torznabEnabled
            jackett.apiKey = data.apiKey
            jackett.json = data.json
            return jackett.Persist().then(function() {
              TorrentSearchEngines.removeJackettFromCache(jackett.name)
              TorrentSearchEngines.addJackettEngine(jackett)
            })
          })

          SettingsService.restore()
          // schedule the next auto-backup after the import in a days time.
          var localDT = new Date()
          var nextBackupDT = new Date(localDT.getFullYear(), localDT.getMonth(), localDT.getDate() + 1, localDT.getHours(), localDT.getMinutes(), localDT.getSeconds()).getTime()
          localStorage.setItem('autobackup.lastrun', nextBackupDT)

          // adjust other settings
          SettingsService.set('autodownload.lastrun', new Date().getTime())
          SettingsService.set('torrenting.enabled', torrentingEnabled) // restore torrenting setting to value prior to restore
          if (localStorage.getItem('torrenting.client') == "qBittorrent 3.2+") {
            console.info('found qBittorrent 3.2+, switching to qBittorrent 4.1+')
            localStorage.setItem('torrenting.client', 'qBittorrent 4.1+')
          }

          backupCount = plan.series.length
          completedCount = 0
          return Promise.all(jackettWrites).then(function() {
            return Promise.all(plan.series.map(function(item) {
              var identity = item.identity
              var identityLabel = identity.type === 'trakt' ? 'TRAKT_ID' : 'TVDB_ID'
              var favoriteData = item.episodes.map(function(episode) {
                var data = {
                  watchedAt: episode.watchedAt,
                  downloaded: episode.downloaded
                }
                data[episode.identity.type === 'trakt' ? 'TRAKT_ID' : 'TVDB_ID'] = episode.identity.id
                return data
              })
              FavoritesService.adding(identity.id)
              return TraktTVv2.resolveID(identity.id, identity.type === 'trakt').then(function(searchResult) {
                console.log('[import] [TRAKT_ID=' + searchResult.trakt_id + ']', 'importing', searchResult.name)
                return TraktTVv2.serie(searchResult.trakt_id)
              }).then(function(serie) {
                $scope.series.push(serie)
                return FavoritesService.addFavorite(serie, favoriteData)
              }).then(function() {
                var filters = {}
                filters[identityLabel] = identity.id
                return CRUD.FindOne('Serie', filters).then(function(serie) {
                  if (!serie) {
                    console.warn('Series by %s %s not found.', identityLabel, identity.id)
                  } else {
                    angular.extend(serie, item.preferences)
                    return serie.Persist()
                  }
                })
              }).then(function() {
                FavoritesService.added(identity.id)
                completedCount++
                $scope.completed = (backupCount === completedCount)
              }, function(error) {
                FavoritesService.addError(identity.id, error)
                completedCount++
                $scope.completed = (backupCount === completedCount)
                return error
              })
            }))
          })
        })
        .catch(function(err) {
          console.error('Backup import failed', err)
          $scope.restoreError = err.message || err
        })
    }

    /**
     * Wipes the database of all series, seasons and episodes and removes all settings
     */
    $scope.wipeDatabase = function(isRestoring) {
      if (!isRestoring) {
        isRestoring = 'N'
      }
      var dlg = dialogs.confirm($filter('translate')('COMMON/wipe/hdr'),
        $filter('translate')('BACKUPCTRLjs/wipe/desc')
      )
      dlg.result.then(function(btn) {
        var db = CRUD.EntityManager.getAdapter().db
        for (var i in localStorage) {
          if (i.indexOf('database.version') == 0) continue
          if (i.indexOf('utorrent.token') == 0) continue
          localStorage.removeItem(i)
        }
        FavoritesService.favorites = []
        FavoritesService.favoriteIDs = []
        FavoritesService.flushAdding()
        CalendarEvents.clearCache()

        return Promise.all(['Series', 'Seasons', 'Episodes', 'Jackett'].map(function(table) {
          return db.execute('DELETE from ' + table + ' where 1').then(function(result) {
            console.log('Database Deleted')
            return true
          })
        })).then(function() {
          if (isRestoring == 'N') {
            window.location.reload()
          } else {
            importBackup()
          }
        })
      }, function(btn) {
        $scope.declined = true
      })
    }

    $scope.refreshDatabase = async function() {
      $scope.refreshingDatabase = true
      $scope.refreshingDatabaseDone = false
      $scope.totalSeries = FavoritesService.favorites.length
      $scope.seriesCompleted = 0
      $rootScope.$broadcast('queryMonitor:update', {
        type: 'start',
        payload: { total: $scope.totalSeries, current: 0 }
      })

      for (var serie of FavoritesService.favorites) {
        try {
          $scope.processingSerie = serie.name
          console.log('[RefreshDataBase] [' + $scope.seriesCompleted + '/' + $scope.totalSeries + ']', 'updating', $scope.processingSerie)
          var newSerie = await TraktTVv2.serie(serie.TRAKT_ID)
          await FavoritesService.addFavorite(newSerie, undefined, true, true)

          $scope.seriesCompleted++
          $rootScope.$broadcast('queryMonitor:update', {
            type: 'progress',
            payload: { total: $scope.totalSeries, current: $scope.seriesCompleted, name: $scope.processingSerie }
          })
        } catch (err) {
          console.error('Error refreshing serie', serie.name, err)
        }
      }

      $rootScope.$broadcast('storage:update')
      $scope.refreshingDatabaseDone = true
      $rootScope.$broadcast('queryMonitor:update', {
        type: 'finish',
        payload: { total: $scope.totalSeries, current: $scope.seriesCompleted + 1 }
      })
    }

    // save the auto-backup-period setting when changed via the autoBackupForm.
    $scope.$watch('autoBackupPeriod', function(newVal, oldVal) {
      if (newVal == oldVal) return
      SettingsService.set('autobackup.period', newVal)
      window.location.reload()
    })
  }
])
