/**
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
DuckieTV.factory('TraktTVUpdateService', ['$q', 'TraktTVv2', 'FavoritesService', 'FanartService', '$rootScope',
  function($q, TraktTVv2, FavoritesService, FanartService, $rootScope) {
    var RECOVERY_LOOKBACK_MS = 1000 * 60 * 60 * 24 * 7
    var service = {
      /**
       * Update shows in favorites list
       * Fetches all updated shows from trakt.tv since date of passed timestamp, checks if local series were updated
       * before that, and updates those.
       * @return promise updated items
       */
      update: async function() {
        var updatedCount = 0
        var i = -1
        var totalSeries = FavoritesService.favorites.length
        $rootScope.$broadcast('queryMonitor:update', {
          type: 'start',
          payload: { total: totalSeries, current: 0 }
        })

        for (var serie of FavoritesService.favorites) {
          try {
            i++
            var newSerie = await TraktTVv2.serie(serie.TRAKT_ID, null, true)
            var timeUpdated = new Date(newSerie.updated_at)
            var serieLastUpdated = new Date(serie.lastupdated)

            $rootScope.$broadcast('queryMonitor:update', {
              type: 'progress',
              payload: { total: totalSeries, current: i, name: serie.name }
            })

            if (timeUpdated <= serieLastUpdated) {
              continue // Hasn't been updated
            }

            console.log('[TraktTVUpdateService] [' + i + '/' + totalSeries + ']', 'updating', serie.name)
            newSerie = await TraktTVv2.serie(newSerie.trakt_id, newSerie)
            await FavoritesService.addFavorite(newSerie, undefined, undefined, true)
            updatedCount++
          } catch (err) {
            console.error('Error updating', serie.name, `[Id=${serie.ID_Serie}] [Trakt=${serie.TRAKT_ID}]`, err)
            // ignored
          }
        }

        $rootScope.$broadcast('queryMonitor:update', {
          type: 'finish',
          payload: { total: totalSeries, current: i + 1 }
        })

        return updatedCount
      },

      /**
       * Save Trakt.TV's trending list to localstorage once a week
       * Fetches images for any new shows added to the trending list
       * Existing shows with posters use their existing poster urls
       */
      updateCachedTrending: async function() {
        const trendingData = await TraktTVv2.trending(true)
        const data = trendingData.map(serie => {
          delete serie.ids
          delete serie.available_translations
          delete serie.title
          delete serie.tvrage_id
          delete serie.imdb_id
          delete serie.updated_at
          delete serie.aired_episodes
          delete serie.homepage
          delete serie.slug_id
          return serie
        })

        localStorage.setItem('trakttv.trending.cache', JSON.stringify(data))
        return true
      },

      /**
       * Detect a stale-calendar profile where visible returning favorites have no
       * future episodes and all known episodes already fell behind the current date window.
       * In that case the startup `trakttv.lastupdated` gate may be newer than the actual DB.
       */
      needsRecoveryUpdate: function() {
        return FavoritesService.waitForInitialization().then(function() {
          var now = new Date().getTime()
          var staleBefore = now - RECOVERY_LOOKBACK_MS
          return CRUD.executeQuery(`
            SELECT
              SUM(CASE WHEN displaycalendar = 1 AND status = 'returning series' THEN 1 ELSE 0 END) AS visibleReturningCount,
              SUM(CASE
                WHEN displaycalendar = 1
                  AND status = 'returning series'
                  AND NOT EXISTS (
                    SELECT 1
                    FROM Episodes
                    WHERE Episodes.ID_Serie = Series.ID_Serie
                      AND Episodes.seasonnumber > 0
                      AND Episodes.firstaired >= ?
                  )
                  AND IFNULL((
                    SELECT MAX(Episodes.firstaired)
                    FROM Episodes
                    WHERE Episodes.ID_Serie = Series.ID_Serie
                      AND Episodes.seasonnumber > 0
                  ), 0) < ?
                THEN 1 ELSE 0
              END) AS staleReturningCount
            FROM Series
          `, [now, staleBefore]).then(function(result) {
            var row = result.rows.length > 0 ? result.rows.item(0) : { visibleReturningCount: 0, staleReturningCount: 0 }
            var visibleReturningCount = +row.visibleReturningCount || 0
            var staleReturningCount = +row.staleReturningCount || 0
            return visibleReturningCount > 0 && staleReturningCount === visibleReturningCount
          }, function(err) {
            console.error('Unable to evaluate stale calendar recovery state.', err)
            return false
          })
        })
      }
    }

    return service
  }
])

DuckieTV.run(['TraktTVUpdateService', 'SettingsService',
  function(TraktTVUpdateService, SettingsService) {
    var updateFunc = function() {
      var localDateTime = new Date().getTime()
      var tuPeriod = parseInt(SettingsService.get('trakt-update.period')) // TraktTV Update period in hours.
      var recoveryCooldownMs = 1000 * 60 * 60 * 24
      if (!localStorage.getItem('trakttv.lastupdated')) {
        localStorage.setItem('trakttv.lastupdated', localDateTime)
      }

      var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')))
      var recoveryLastAttempt = parseInt(localStorage.getItem('trakttv.lastforcedupdate')) || 0
      if ((parseInt(localStorage.getItem('trakttv.lastupdated')) + (1000 * 60 * 60 * tuPeriod)) /* hours */ <= localDateTime) {
        TraktTVUpdateService.update(lastUpdated).then(function(count) {
          console.info('TraktTV update check completed. ' + count + ' shows updated since ' + lastUpdated)
          localStorage.setItem('trakttv.lastupdated', localDateTime)
        })
      } else {
        console.info('Not performing TraktTV update check. Already done within the last %s hour(s).', tuPeriod)
        TraktTVUpdateService.needsRecoveryUpdate().then(function(needsRecoveryUpdate) {
          if (!needsRecoveryUpdate) {
            return
          }

          if (recoveryLastAttempt + recoveryCooldownMs > localDateTime) {
            console.info('Skipping stale-calendar recovery update. Already attempted within the last 24 hour(s).')
            return
          }

          console.info('Forcing TraktTV recovery update because visible returning favorites appear stale.')
          localStorage.setItem('trakttv.lastforcedupdate', localDateTime)
          TraktTVUpdateService.update(lastUpdated).then(function(count) {
            console.info('TraktTV recovery update completed. ' + count + ' shows updated since ' + lastUpdated)
            localStorage.setItem('trakttv.lastupdated', localDateTime)
          })
        })
      }

      if (!localStorage.getItem('trakttv.lastupdated.trending')) {
        localStorage.setItem('trakttv.lastupdated.trending', 0)
      }

      if ((parseInt(localStorage.getItem('trakttv.lastupdated.trending')) + (1000 * 60 * 60 * 24 * 1)) /* 1 day */ < new Date().getTime()) {
        TraktTVUpdateService.updateCachedTrending().then(function() {
          console.info('TraktTV trending update completed. last updated:' + new Date(parseInt(localStorage.getItem('trakttv.lastupdated.trending'))).toString())
          localStorage.setItem('trakttv.lastupdated.trending', new Date().getTime())
        })
      } else {
        console.info('Not performing TraktTV trending update check. Last done ' + new Date(parseInt(localStorage.getItem('trakttv.lastupdated.trending'))).toString())
      }

      setTimeout(updateFunc, 1000 * 60 * 60 * tuPeriod) // schedule update check every tuPeriod hour(s) for long running apps.
    }

    setTimeout(updateFunc, 5000)
  }
])
