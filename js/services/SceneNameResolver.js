/**
 * Scene name provider
 * Converts Trakt series names into scene torrent names that you can use on search engines.
 */
DuckieTV.factory('SceneNameResolver', ['$q', '$http', 'SceneXemResolver',
  function($q, $http, SceneXemResolver) {
    // credits to Sickbeard's exception list https://raw.github.com/midgetspy/sb_tvdb_scene_exceptions/gh-pages/exceptions.txt
    //
    // filters applied:
    // - Removed `(([12][09][0-9]{2}))` (all years between 19* and 20* within () )
    // - Replaced `\'` with `'`
    // - Replaced surrounding `'` with `"`
    // - Replaced `.` with ` `
    // - Remove special characters `(){}[]/\|:;<>!@#$%^&*-=_+`
    // - line sort

    var episodesWithDateFormat = {}
    var exceptions = {}
    var traktidTvdbidXref = {}

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
       * Return the scene name of the provided TRAKT_ID if it's in the list, unfiltered.
       */
      getSceneName: function(traktID, name) {
        traktID = parseInt(traktID)
        return (traktID in exceptions) ? exceptions[traktID] : filterName(name)
      },

      getSearchStringForEpisode: function(serie, episode) {
        var append = (serie.customSearchString && serie.customSearchString != '') ? ' ' + serie.customSearchString : ''
        var traktID = parseInt(serie.TRAKT_ID)
        // Return the scene name of the provided TRAKT_ID if it's in the list, unfiltered.
        var sceneName = (traktID in exceptions) ? exceptions[traktID] + ' ' : filterName(serie.name) + ' '
        if (serie.alias) {
          // replaces sceneName with serie.alias if it has been set. NOTE: alias is unfiltered
          sceneName = serie.alias + ' '
        }
        if (serie.TRAKT_ID in episodesWithDateFormat) {
          if (typeof (moment) === 'undefined') {
            moment = require('./js/vendor/moment.quacked.js')
          }

          // check for custom DD modifier, examples DD[-1] , DD[+5] , etc, which subtracts or adds to the number of days
          if (episodesWithDateFormat[serie.TRAKT_ID].indexOf("DD[") > -1) {
            // extract the modifier
            var startDD = episodesWithDateFormat[serie.TRAKT_ID].indexOf("[")
            var endDD = episodesWithDateFormat[serie.TRAKT_ID].indexOf("]") + 1
            var modifierDD = episodesWithDateFormat[serie.TRAKT_ID].slice(startDD, endDD)
            var dateFormat = episodesWithDateFormat[serie.TRAKT_ID].replace(modifierDD, "")
            if (modifierDD.indexOf("-") > -1) {
              // subtract days
              var modifierNumber = modifierDD.replace("[-", "").replace("]", "")
              return $q.resolve(sceneName + moment.tz(episode.firstaired_iso, serie.timezone).subtract(modifierNumber, 'd').format(dateFormat) + append)
            } else {
              // add days
              var modifierNumber = modifierDD.replace("[+", "").replace("]", "")
              return $q.resolve(sceneName + moment.tz(episode.firstaired_iso, serie.timezone).add(modifierNumber, 'd').format(dateFormat) + append)
            }
          } else {
            return $q.resolve(sceneName + moment.tz(episode.firstaired_iso, serie.timezone).format(episodesWithDateFormat[serie.TRAKT_ID]) + append)
          }
        } else {
          return SceneXemResolver.getEpisodeMapping(serie, episode, sceneName, append)
        }
      },

      /**
       * Return a TVDB_ID given the provided TRAKT_ID if it's in the list or null.
       */
      getTvdbidFromTraktid: function(traktID) {
        traktID = parseInt(traktID)
        return (traktID in traktidTvdbidXref) ? traktidTvdbidXref[traktID] : null
      },

      /**
       * Return last TRAKT_ID in traktidTvdbidXref
       */
      getLastTraktidXref: function() {
        return parseInt(Object.keys(traktidTvdbidXref)[Object.keys(traktidTvdbidXref).length-1])
      },

      initialize: function() {
        var lastFetched = ('snrt.lastFetched' in localStorage) ? new Date(parseInt(localStorage.getItem('snrt.lastFetched'))) : new Date()

        if (('snrt.traktid-tvdbid-xref' in localStorage) && lastFetched.getTime() + 86400000 > new Date().getTime()) {
          exceptions = JSON.parse(localStorage.getItem('snrt.name-exceptions'))
          episodesWithDateFormat = JSON.parse(localStorage.getItem('snrt.date-exceptions'))
          traktidTvdbidXref = JSON.parse(localStorage.getItem('snrt.traktid-tvdbid-xref'))
          console.info('Next SNRT update is due after ', new Date(lastFetched.getTime() + 86400000))
          console.info('Fetched SNRT name and date exceptions, and TraktTvdbXref from localStorage.')
        } else {
          $http.get('https://duckietv.github.io/SceneNameExceptions/TraktSceneNameExceptions.json').then(function(response) {
            exceptions = response.data
            localStorage.setItem('snrt.name-exceptions', JSON.stringify(exceptions))
          })

          $http.get('https://duckietv.github.io/SceneNameExceptions/TraktSceneDateExceptions.json').then(function(response) {
            episodesWithDateFormat = response.data
            localStorage.setItem('snrt.date-exceptions', JSON.stringify(episodesWithDateFormat))
          })

          $http.get('https://duckietv.github.io/SceneNameExceptions/TraktidTvdbidXref.json').then(function(response) {
            traktidTvdbidXref = response.data
            localStorage.setItem('snrt.traktid-tvdbid-xref', JSON.stringify(traktidTvdbidXref))
            localStorage.setItem('snrt.lastFetched', new Date().getTime())
          })

          console.info('Updated localStorage with SNRT name and date exceptions, and TraktTvdbXref.')
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
