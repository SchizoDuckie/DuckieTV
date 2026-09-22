/**
 * Owns the current backup wire format and converts historical TVDB- and
 * Trakt-keyed backups into the same validated restore plan.
 */
DuckieTV.factory('BackupCodec', [function() {
  var FORMAT_VERSION = 2
  var preferenceKeys = [
    'displaycalendar', 'autoDownload', 'customSearchString', 'ignoreGlobalQuality',
    'ignoreGlobalIncludes', 'ignoreGlobalExcludes', 'searchProvider', 'ignoreHideSpecials',
    'customSearchSizeMin', 'customSearchSizeMax', 'dlPath', 'customDelay', 'alias',
    'customFormat', 'customIncludes', 'customExcludes', 'customSeeders'
  ]

  function copyPreferences(source) {
    return preferenceKeys.reduce(function(output, key) {
      if (key in source) output[key] = source[key]
      return output
    }, {})
  }

  function parse(input) {
    if (angular.isString(input)) {
      try {
        return angular.fromJson(input)
      } catch (error) {
        throw new Error('Backup is not valid JSON')
      }
    }
    return input
  }

  function normalizeSettings(settings) {
    if (!settings || !angular.isObject(settings) || angular.isArray(settings)) {
      throw new Error('Backup settings must be an object')
    }
    var output = angular.copy(settings)
    var jackett = []
    if ('jackett' in output) {
      try {
        jackett = angular.isString(output.jackett) ? angular.fromJson(output.jackett) : output.jackett
      } catch (error) {
        throw new Error('Backup Jackett settings are malformed')
      }
      if (!angular.isArray(jackett)) throw new Error('Backup Jackett settings must be an array')
      delete output.jackett
    }
    delete output.useTrakt_id
    jackett = jackett.map(function(item) {
      if (!item || !angular.isObject(item) || angular.isArray(item) || !angular.isString(item.name)) {
        throw new Error('Backup Jackett entry is invalid')
      }
      return angular.copy(item)
    })
    return { settings: output, jackett: jackett }
  }

  function validateIdentity(identity, label) {
    if (!identity || ['trakt', 'tvdb'].indexOf(identity.type) === -1 || identity.id === null || typeof identity.id === 'undefined') {
      throw new Error(label + ' identity is invalid')
    }
    return { type: identity.type, id: identity.id }
  }

  function normalizeCurrent(input, normalizedSettings) {
    if (!angular.isArray(input.series)) throw new Error('Backup series must be an array')
    return {
      formatVersion: FORMAT_VERSION,
      sourceFormatVersion: input.formatVersion,
      settings: normalizedSettings.settings,
      jackett: normalizedSettings.jackett,
      series: input.series.map(function(item) {
        if (!item || !angular.isObject(item)) throw new Error('Backup series entry is invalid')
        if (!item.preferences || !angular.isObject(item.preferences) || angular.isArray(item.preferences) || !angular.isArray(item.episodes)) {
          throw new Error('Backup series entry is incomplete')
        }
        return {
          identity: validateIdentity(item.identity, 'Series'),
          preferences: copyPreferences(item.preferences),
          episodes: item.episodes.map(function(episode) {
            if (!episode || !angular.isObject(episode) || angular.isArray(episode)) {
              throw new Error('Backup episode entry is invalid')
            }
            return {
              identity: validateIdentity(episode.identity, 'Episode'),
              watchedAt: episode.watchedAt || null,
              downloaded: episode.downloaded || 0
            }
          })
        }
      })
    }
  }

  function normalizeLegacy(input, normalizedSettings) {
    if (!input.series || !angular.isObject(input.series) || angular.isArray(input.series)) {
      throw new Error('Legacy backup series must be an object')
    }
    var identityType = input.settings.useTrakt_id ? 'trakt' : 'tvdb'
    return {
      formatVersion: FORMAT_VERSION,
      sourceFormatVersion: 1,
      settings: normalizedSettings.settings,
      jackett: normalizedSettings.jackett,
      series: Object.keys(input.series).map(function(id) {
        var data = input.series[id]
        if (!angular.isArray(data)) throw new Error('Legacy backup series entry must be an array')
        var first = data[0]
        if (data.length > 0 && (!first || !angular.isObject(first) || angular.isArray(first))) {
          throw new Error('Legacy backup series data is invalid')
        }
        var preferences = data.length > 0 && !('TVDB_ID' in first) && !('TRAKT_ID' in first) ? first : {}
        var episodes = data.slice(preferences === data[0] ? 1 : 0).map(function(episode) {
          if (!episode || !angular.isObject(episode) || angular.isArray(episode)) {
            throw new Error('Legacy backup episode entry is invalid')
          }
          var episodeType = episode.TRAKT_ID ? 'trakt' : 'tvdb'
          var episodeID = episode.TRAKT_ID || episode.TVDB_ID
          return {
            identity: validateIdentity({ type: episodeType, id: episodeID }, 'Episode'),
            watchedAt: episode.watchedAt || null,
            downloaded: episode.downloaded || 0
          }
        })
        return {
          identity: { type: identityType, id: id },
          preferences: copyPreferences(preferences),
          episodes: episodes
        }
      })
    }
  }

  return {
    formatVersion: FORMAT_VERSION,
    serialize: function(settings, seriesRows, episodeRows) {
      var series = seriesRows.map(function(row) {
        return {
          identity: { type: 'trakt', id: row.TRAKT_ID },
          preferences: copyPreferences(row),
          episodes: []
        }
      })
      var byID = series.reduce(function(map, item) {
        map[item.identity.id] = item
        return map
      }, {})
      episodeRows.forEach(function(row) {
        if (!byID[row.TRAKT_ID]) return
        byID[row.TRAKT_ID].episodes.push({
          identity: { type: 'trakt', id: row.epTRAKT_ID },
          watchedAt: row.watchedAt ? new Date(row.watchedAt).getTime() : null,
          downloaded: row.downloaded || 0
        })
      })
      return { formatVersion: FORMAT_VERSION, settings: settings, series: series }
    },
    normalize: function(input) {
      input = parse(input)
      if (!input || !angular.isObject(input) || angular.isArray(input)) throw new Error('Backup root must be an object')
      var normalizedSettings = normalizeSettings(input.settings)
      if (typeof input.formatVersion === 'undefined') return normalizeLegacy(input, normalizedSettings)
      if (input.formatVersion !== FORMAT_VERSION) throw new Error('Unsupported backup format version ' + input.formatVersion)
      return normalizeCurrent(input, normalizedSettings)
    }
  }
}])

DuckieTV.factory('BackupService', ['TorrentSearchEngines', 'BackupCodec', function(TorrentSearchEngines, BackupCodec) {
  var service = {
    createBackup: function() {
      // Fetch all the series
      return CRUD.executeQuery('select Series.TRAKT_ID, Series.displaycalendar, Series.autoDownload, Series.customSearchString, Series.ignoreGlobalQuality, Series.ignoreGlobalIncludes, Series.ignoreGlobalExcludes, Series.searchProvider, Series.ignoreHideSpecials, Series.customSearchSizeMin, Series.customSearchSizeMax, Series.dlPath, Series.customDelay, Series.alias, Series.customFormat, Series.customIncludes, Series.customExcludes, Series.customSeeders from Series').then(function(series) {
        var settings = {}
        /*
        * grab Jackett from cache and convert into pseudo localStorage for saving into the backup's _settings_ section
        * this allows us to maintain backward compatibility with older DuckieTV versions
        */
        settings.jackett = JSON.stringify(TorrentSearchEngines.jackettCache)
        // Store all the settings
        for (var i = 0; i < localStorage.length; i++) {
          if (localStorage.key(i) == 'jackett') continue
          if (localStorage.key(i).indexOf('database.version') > -1) continue
          if (localStorage.key(i).indexOf('trakttv.trending.cache') > -1) continue
          if (localStorage.key(i).indexOf('trakttv.lastupdated.trending') > -1) continue
          if (localStorage.key(i).indexOf('snrt.name-exceptions') > -1) continue
          if (localStorage.key(i).indexOf('snrt.date-exceptions') > -1) continue
          if (localStorage.key(i).indexOf('snrt.traktid-tvdbid-xref') > -1) continue
          if (localStorage.key(i).indexOf('snrt.lastFetched') > -1) continue
          settings[localStorage.key(i)] = localStorage.getItem(localStorage.key(i))
        }

        // Store watched episodes for each serie
        return CRUD.executeQuery('select Series.TRAKT_ID, Episodes.TRAKT_ID as epTRAKT_ID, Episodes.watchedAt, Episodes.downloaded from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.downloaded == 1 or  Episodes.watchedAt is not null').then(function(res) {
          var out = BackupCodec.serialize(settings, series.rows, res.rows)

          var blob = new Blob([angular.toJson(out, true)], {
            type: 'text/json'
          })

          return blob
        })
      })
    }
  }

  return service
}])

/**
 * at start-up set up a timer for the autoBackup
 */
DuckieTV.run(['BackupService', 'SettingsService', 'FavoritesService', 'dialogs',
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
              console.info('Scheduled autoBackup run at ', new Date())
              dialogs.create('templates/dialogs/backup.html', 'backupDialogCtrl', {}, {
                size: 'lg'
              })
            }
          } else {
            console.info('autoBackup is not required as there are no shows in favourites yet.')
          }
        } else {
          setTimeout(function() {
            scheduleAutoBackup()
          }, 1000)
        }
      }, timeToNextBackup)
    }

    var autoBackupPeriod = SettingsService.get('autobackup.period')
    if (autoBackupPeriod === 'never') {
      console.warn('autoBackup is set to never be scheduled')
      return // autoBackup is not requested
    }

    // init last run time if not defined
    var localDT = new Date().getTime()
    if (!localStorage.getItem('autobackup.lastrun')) {
      localStorage.setItem('autobackup.lastrun', localDT)
    }

    // determine next run time
    var lastRun = new Date(parseInt(localStorage.getItem('autobackup.lastrun')))
    var nextBackupDT = null

    switch (autoBackupPeriod) {
      case 'daily':
        nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 1, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime()
        break
      case 'weekly':
        nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate() + 7, lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime()
        break
      case 'monthly':
        nextBackupDT = new Date(lastRun.getFullYear(), lastRun.getMonth() + 1, lastRun.getDate(), lastRun.getHours(), lastRun.getMinutes(), lastRun.getSeconds()).getTime()
        break
      default:
        console.error('unexpected autoBackupPeriod', autoBackupPeriod)
    }

    // schedule the timer for the next backup
    var timeToNextBackup = (nextBackupDT - localDT)
    if (timeToNextBackup > 0) {
      console.info('The next autoBackup is scheduled for', new Date(parseInt(nextBackupDT)))
    } else {
      timeToNextBackup = 60000 // the auto-backup will be started in a minute, to allow for start-up processes to complete.
    }

    scheduleAutoBackup()
  }
])
