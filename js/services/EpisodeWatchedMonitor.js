/**
 * Recompute season and show watched counts from stored episode state. One
 * worker processes the show IDs queued by watched events and library updates.
 */
DuckieTV.factory('watchedCounter', ['$q', 'FavoritesService', function($q, FavoritesService) {
  var pending = {}
  var drainPromise = null

  /** Group SQL counts by season ID and fill in zero for any missing watched status. */
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
   * Persist counts for the seasons represented in the query. Resolve to the
   * show's aggregate only after the season writes complete.
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
   * Write the aggregate to the cached show entity used by the library views.
   */
  function markSerieWatched(ID_Serie, data) {
    var serie = FavoritesService.getByID_Serie(ID_Serie)
    // console.debug("Serie watched? ", serie.name, serie.watched, data.allSeasonsWatched, data.notWatchedTotal);
    serie.watched = data.allSeasonsWatched === false ? 0 : 1
    serie.notWatchedCount = data.notWatchedTotal
    return serie.Persist()
  }

  /** Let queued episode writes finish before querying their watched state. */
  function waitForWrites() {
    if (CRUD.stats.writesExecuted == CRUD.stats.writesQueued) return $q.when()
    return $q(function(resolve) {
      setTimeout(resolve, 50)
    }).then(waitForWrites)
  }

  /** Recount aired episodes in regular seasons, then save season and show totals in that order. */
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

  /** Process each pending show in sequence and report the first error after draining the queue. */
  function drain() {
    var firstError = null

    function next() {
      var ID_Serie = Object.keys(pending)[0]
      if (ID_Serie === undefined) {
        if (firstError !== null) throw firstError
        return true
      }

      // Requests for this show during the recount can schedule one more pass.
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
    /** Queue a local show ID for recount and return the active worker's shared promise. */
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
