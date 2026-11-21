/**
 * Handles creating and importing a backup.
 *
 * see app.js for the backup format structure description
 */
DuckieTV.controller('BackupCtrl', ['$rootScope', '$scope', '$filter', '$q', 'BackupService', 'BackupCodec', 'dialogs', 'FileReader', 'TraktTVv2', 'SettingsService', 'FavoritesService', 'CalendarEvents', 'TorrentSearchEngines',
  function($rootScope, $scope, $filter, $q, BackupService, BackupCodec, dialogs, FileReader, TraktTVv2, SettingsService, FavoritesService, CalendarEvents, TorrentSearchEngines) {
    $scope.wipeBeforeImport = false
    $scope.series = []

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

    $scope.restore = function(file) {
      if (!file || $scope.restoring) return
      $scope.restoring = true
      $scope.completed = false
      $scope.declined = false
      $scope.restoreError = null
      $scope.restoreTotal = 0
      $scope.restoreProcessed = 0
      $scope.restoreFailed = 0
      $scope.restoreActivity = { phase: 'read', name: file.name }
      FavoritesService.flushAdding()
      $scope.series = []

      return $q.when().then(function() {
        return FileReader.readAsText(file, $scope)
      }).then(BackupCodec.normalize).then(function(plan) {
        if (!$scope.wipeBeforeImport) return importBackup(plan)
        $scope.restoreActivity.phase = 'wipe'
        return $scope.wipeDatabase(true).then(function(confirmed) {
          if (confirmed) return importBackup(plan)
          $scope.declined = true
        })
      }).then(function() {
        $scope.completed = !$scope.declined
      }).catch(function(error) {
        console.error('Backup import failed', error)
        $scope.restoreError = error && (error.message || String(error)) || ''
      }).finally(function() {
        $scope.restoring = false
      })
    }

    /**
     * Apply a validated backup and feed its series to FavoritesService.
     * The FavoritesService has a method to automagically import the watched episodes
     * (which is a bit hacky as it should be part of the import)
     */
    var importBackup = function(plan) {
      $scope.restoreActivity.phase = 'settings'
      $scope.restoreTotal = plan.series.length
      var torrentingEnabled = SettingsService.get('torrenting.enabled')

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
      SettingsService.set('torrenting.enabled', torrentingEnabled)
      if (localStorage.getItem('torrenting.client') == "qBittorrent 3.2+") {
        console.info('found qBittorrent 3.2+, switching to qBittorrent 4.1+')
        localStorage.setItem('torrenting.client', 'qBittorrent 4.1+')
      }

      return $q.all(jackettWrites).then(function() {
        // Trakt serializes requests. Finish each show before queuing the next show's lookups.
        return plan.series.reduce(function(previous, item) {
          return previous.then(function() { return restoreSeries(item) })
        }, $q.when())
      })
    }

    function restoreSeries(item) {
      var identity = item.identity
      var usesTraktId = identity.type === 'trakt'
      var traktId = usesTraktId ? identity.id : null
      var activity = { phase: 'lookup', name: (usesTraktId ? 'Trakt ' : 'TVDB ') + identity.id }
      $scope.restoreActivity = activity
      function report(phase, done, total) {
        activity.phase = phase
        activity.done = done
        activity.total = total
        $scope.$applyAsync()
      }
      var poster
      var favoriteData = item.episodes.map(function(episode) {
        var data = {
          watchedAt: episode.watchedAt,
          downloaded: episode.downloaded
        }
        data[episode.identity.type === 'trakt' ? 'TRAKT_ID' : 'TVDB_ID'] = episode.identity.id
        return data
      })

      return $q.when().then(function() {
        if (usesTraktId) FavoritesService.adding(traktId)
        return TraktTVv2.resolveID(identity.id, usesTraktId)
      }).then(function(searchResult) {
        if (!usesTraktId) {
          traktId = searchResult.trakt_id
          FavoritesService.adding(traktId)
        }
        console.log('[import] [TRAKT_ID=' + searchResult.trakt_id + ']', 'importing', searchResult.name)
        activity.name = searchResult.title || searchResult.name || activity.name
        activity.phase = 'details'
        return TraktTVv2.serie(searchResult.trakt_id, undefined, false, function(done, total) {
          report('fetch', done, total)
        })
      }).then(function(serie) {
        poster = { data: serie, state: 'adding' }
        $scope.series.push(poster)
        activity.name = serie.title || activity.name
        report('library')
        return FavoritesService.addFavorite(serie, favoriteData, usesTraktId, false, function(done, total) {
          report('save', done, total)
        })
      }).then(function() {
        report('preferences')
        var filters = {}
        filters[usesTraktId ? 'TRAKT_ID' : 'TVDB_ID'] = identity.id
        return CRUD.FindOne('Serie', filters)
      }).then(function(serie) {
        if (!serie) throw new Error('Restored series could not be found')
        angular.extend(serie, item.preferences)
        return serie.Persist()
      }).then(function() {
        FavoritesService.added(traktId)
        poster.state = 'added'
      }).catch(function(error) {
        console.error('Could not restore series', identity, error)
        if (traktId !== null) FavoritesService.addError(traktId, error)
        if (poster) poster.state = 'error'
        $scope.restoreFailed++
      }).finally(function() {
        $scope.restoreProcessed++
      })
    }

    /**
     * Wipes the database of all series, seasons and episodes and removes all settings
     */
    $scope.wipeDatabase = function(isRestoring) {
      var dlg = dialogs.confirm($filter('translate')('COMMON/wipe/hdr'),
        $filter('translate')('BACKUPCTRLjs/wipe/desc')
      )
      return dlg.result.then(function() {
        var db = CRUD.EntityManager.getAdapter().db
        for (var i in localStorage) {
          if (i.indexOf('database.version') == 0 || i.startsWith('duckietv.storage.')) continue
          if (i.indexOf('utorrent.token') == 0) continue
          localStorage.removeItem(i)
        }
        FavoritesService.favorites = []
        FavoritesService.favoriteIDs = []
        FavoritesService.flushAdding()
        CalendarEvents.clearCache()

        return $q.all(['Series', 'Seasons', 'Episodes', 'Jackett'].map(function(table) {
          return db.execute('DELETE from ' + table + ' where 1')
        })).then(function() {
          if (!isRestoring) window.location.reload()
          return true
        })
      }, function() {
        if (!isRestoring) $scope.declined = true
        return false
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
