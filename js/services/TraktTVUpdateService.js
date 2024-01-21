/**
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
DuckieTV.factory('TraktTVUpdateService', ['$q', 'TraktTVv2', 'FavoritesService', 'FanartService', '$rootScope',
  function($q, TraktTVv2, FavoritesService, FanartService, $rootScope) {
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
      if (!localStorage.getItem('trakttv.lastupdated')) {
        localStorage.setItem('trakttv.lastupdated', localDateTime)
      }

      var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')))
      if ((parseInt(localStorage.getItem('trakttv.lastupdated')) + (1000 * 60 * 60 * tuPeriod)) /* hours */ <= localDateTime) {
        TraktTVUpdateService.update(lastUpdated).then(function(count) {
          console.info('TraktTV update check completed. ' + count + ' shows updated since ' + lastUpdated)
          localStorage.setItem('trakttv.lastupdated', localDateTime)
        })
      } else {
        console.info('Not performing TraktTV update check. Already done within the last %s hour(s).', tuPeriod)
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
