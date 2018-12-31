/**
 * Scene name provider
 * Resolves TheTvDB ID's into something that you can use on search engines.
 */
DuckieTV.factory('SceneNameResolver', ['$q', '$http', 'SceneXemResolver',
  function($q, $http, SceneXemResolver) {
    // credits to Sickbeard's exception list https://raw.github.com/midgetspy/sb_tvdb_scene_exceptions/gh-pages/exceptions.txt
    // filters applied:
    // - Remove :
    // - Remove \(([12][09][0-9]{2})\) (all years between 19* and 20* within () )
    // - replace \' with '
    // - replace surrounding " with '
    // remove (US)
    // line sort

    var episodesWithDateFormat = {}
    var exceptions = {}

    /**
     * Replace the most common diacritics in English that are most likely to not be used in torrent scene names
     * its not all-inclusive, that list is just too huge, but we can easily add any more that we come across.
     */
    var replaceDiacritics = function(source) {
      return source.replace(/[ÀÁÂÃÄÅ]/g, 'A').replace(/[ÈÉÊË]/g, 'E').replace(/[ÌÍÎÏ]/g, 'I').replace(/[ÒÓÔÕÖ]/g, 'O').replace(/[ÙÚÛÜ]/g, 'U').replace(/[Ç]/g, 'C').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c')
    }

    /**
     * strip the bracketed year, and all special characters apart from space and minus, and replace diacritics
     */
    var filterName = function(source) {
      return replaceDiacritics(source).replace(/\(([12][09][0-9]{2})\)/, '').replace(/[^0-9a-zA-Z- ]/g, '')
    }

    return {
      /**
       * Return the scene name of the provided TVDB_ID if it's in the list, unfiltered.
       */
      getSceneName: function(tvdbID, name) {
        tvdbID = parseInt(tvdbID)
        return (tvdbID in exceptions) ? exceptions[tvdbID] : filterName(name)
      },

      getSearchStringForEpisode: function(serie, episode) {
        var append = (serie.customSearchString && serie.customSearchString != '') ? ' ' + serie.customSearchString : ''
        var tvdbID = parseInt(serie.TVDB_ID)
        // Return the scene name of the provided TVDB_ID if it's in the list, unfiltered.
        var sceneName = (tvdbID in exceptions) ? exceptions[tvdbID] + ' ' : filterName(serie.name) + ' '
        if (serie.alias) {
          // replaces sceneName with serie.alias if it has been set. NOTE: alias is unfiltered
          sceneName = serie.alias + ' '
        }
        if (serie.TVDB_ID in episodesWithDateFormat) {
          if (typeof (moment) === 'undefined') {
            moment = require('./js/vendor/moment.min')
          }

          return $q.resolve(sceneName + moment.tz(episode.firstaired_iso, serie.timezone).format(episodesWithDateFormat[serie.TVDB_ID]) + append)
        } else {
          return SceneXemResolver.getEpisodeMapping(serie, episode, sceneName, append)
        }
      },

      initialize: function() {
        var lastFetched = ('snr.lastFetched' in localStorage) ? new Date(parseInt(localStorage.getItem('snr.lastFetched'))) : new Date()

        if (('snr.name-exceptions' in localStorage) && lastFetched.getTime() + 86400000 > new Date().getTime()) {
          exceptions = JSON.parse(localStorage.getItem('snr.name-exceptions'))
          episodesWithDateFormat = JSON.parse(localStorage.getItem('snr.date-exceptions'))
          console.info('Fetched SNR name and date exceptions from localStorage.')
        } else {
          $http.get('https://duckietv.github.io/SceneNameExceptions/SceneNameExceptions.json').then(function(response) {
            exceptions = response.data
            localStorage.setItem('snr.name-exceptions', JSON.stringify(exceptions))
          })

          $http.get('https://duckietv.github.io/SceneNameExceptions/SceneDateExceptions.json').then(function(response) {
            episodesWithDateFormat = response.data
            localStorage.setItem('snr.date-exceptions', JSON.stringify(episodesWithDateFormat))
            localStorage.setItem('snr.lastFetched', new Date().getTime())
          })

          console.info('Updated localStorage with SNR name and date exceptions.')
        }
      }
    }
  }
])

DuckieTV.run(['SceneNameResolver',
  function(SceneNameResolver) {
    SceneNameResolver.initialize()
  }
])
