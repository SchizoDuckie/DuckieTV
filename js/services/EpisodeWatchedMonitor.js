/**
 * Episode watched monitor
 * Count all episodes watched for a season when changes occur, flip switches accordingly.
 */
DuckieTV.factory('watchedCounter', ['$q', 'FavoritesService', function($q, FavoritesService) {
  var pending = {}
  var drainPromise = null

  /**
     * Parse the episodes count returned from the recountSerie function into an object with season keys.
     * format:
     * {
     *   seasonID : { watched: <int>, notWatched: int },
     *   [...]
     * }
     * @return Object with season watched episode counts
     */
  function parseEpisodeCounts(counts) {
    var seasons = {}

    counts.rows.map(function(row) {
      if (!(row.ID_Season in seasons)) {
        seasons[row.ID_Season] = {
          watched: 0,
          notWatched: 0
        }
      }
      seasons[row.ID_Season][row.watched === 0 ? 'notWatched' : 'watched'] = row.amount
    })

    return seasons
  }

  /**
   * Iterate the output from parseEpisodeCounts
   * and mark every season as either watched or not watched based if notWatched = 0 (indicating that all episodes are watched)
   * Persist new season watched statuses, and return an intermediate array with boolean values that have a true/false for
   * every serie. reduce the boolean array into a single digit representing watched seasons for serie.
   * Return boolean that tells if number of seasons in the show matches watched season count.
   *
   * @return {boolean allSeasonsWatched, integer notWatchedTotal}
   */
  function markSeasonsWatched(seasons) {
    var notWatchedTotal = 0 // sum of all serie's seasons' notWatched episodes
    return $q.all(Object.keys(seasons).map(function(season) {
      return CRUD.FindOne('Season', {
        ID_Season: season
      }).then(function(s) {
        s.watched = seasons[season].notWatched === 0 ? 1 : 0
        s.notWatchedCount = seasons[season].notWatched
        notWatchedTotal = notWatchedTotal + seasons[season].notWatched
        // console.debug("Season watched? ", season, s.watched === 1);
        return s.Persist().then(function() {
          return s.watched === 1
        })
      })
    })).then(function(result) {
      var watchedSeasonCount = result.reduce(function(prev, current) {
        return prev + (current === true ? 1 : 0)
      }, 0)
      var allSeasonsWatched = Object.keys(seasons).length == watchedSeasonCount
      return {
        'allSeasonsWatched': allSeasonsWatched,
        'notWatchedTotal': notWatchedTotal
      }
    })
  }

  /**
   * Fetch serie from favoritesservice for performance and toggle watched flag.
   */
  function markSerieWatched(ID_Serie, data) {
    var serie = FavoritesService.getByID_Serie(ID_Serie)
    // console.debug("Serie watched? ", serie.name, serie.watched, data.allSeasonsWatched, data.notWatchedTotal);
    serie.watched = data.allSeasonsWatched === false ? 0 : 1
    serie.notWatchedCount = data.notWatchedTotal
    return serie.Persist()
  }

  function waitForWrites() {
    if (CRUD.stats.writesExecuted == CRUD.stats.writesQueued) return $q.when()
    return $q(function(resolve) {
      setTimeout(resolve, 50)
    }).then(waitForWrites)
  }

  function processSerie(ID_Serie) {
    // console.debug("Re counting! ", ID_Serie);
    var query = 'select ID_Season, watched, count(watched) as amount from Episodes where ID_Serie = ? AND seasonnumber > 0 AND firstaired <= ? AND firstaired_iso NOT null GROUP BY ID_Season, watched'
    return CRUD.executeQuery(query, [ID_Serie, new Date().getTime()])
      .then(parseEpisodeCounts)
      .then(markSeasonsWatched)
      .then(function(result) {
        return markSerieWatched(ID_Serie, result)
      })
  }

  function drain() {
    var firstError = null

    function next() {
      var ID_Serie = Object.keys(pending)[0]
      if (ID_Serie === undefined) {
        if (firstError !== null) throw firstError
        return true
      }

      delete pending[ID_Serie]
      return waitForWrites()
        .then(function() {
          return processSerie(ID_Serie)
        })
        .catch(function(error) {
          firstError = firstError || error
        })
        .then(next)
    }

    return next()
  }

  return {
    recountSerie: function(ID_Serie) {
      pending[ID_Serie] = true
      if (drainPromise === null) {
        drainPromise = drain().finally(function() {
          drainPromise = null
          if (Object.keys(pending).length > 0) {
            drainPromise = drain().finally(function() {
              drainPromise = null
            })
          }
        })
      }
      return drainPromise
    }
  }
}])

DuckieTV.run(['$rootScope', 'FavoritesService', 'watchedCounter', function($rootScope, FavoritesService, watchedCounter) {
  /**
     * Catch the event when an episode is marked as watched
     */
  $rootScope.$on('episode:marked:watched', function(evt, episode) {
    watchedCounter.recountSerie(episode.ID_Serie)
  })
  /**
     * Catch the event when an episode is marked as NOT watched
     */
  $rootScope.$on('episode:marked:notwatched', function(evt, episode) {
    watchedCounter.recountSerie(episode.ID_Serie)
  })
  /**
     * Catch serie update events
     */
  $rootScope.$on('serie:recount:watched', function(evt, serieID) {
    watchedCounter.recountSerie(serieID)
  })

  /**
     * Catch global recount event (for migrations 'n stuff )
     */
  $rootScope.$on('series:recount:watched', function() {
    angular.forEach(FavoritesService.favorites, function(serie) {
      watchedCounter.recountSerie(serie.ID_Serie)
    })
  })
}])
