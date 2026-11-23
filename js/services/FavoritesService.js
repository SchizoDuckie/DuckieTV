/**
 * Persists favorite shows and their seasons and episodes. Keeps an in-memory
 * library of show entities for the calendar, search, and watched counts.
 */
DuckieTV.factory('FavoritesService', ['$q', '$rootScope', 'FanartService', 'SceneNameResolver', '$injector',
  function($q, $rootScope, FanartService, SceneNameResolver, $injector) {
    function refreshFavoriteIDs() {
      service.favoriteIDs = []
      service.favorites.forEach(function(serie) {
        if (serie.TRAKT_ID != null) service.favoriteIDs.push(serie.TRAKT_ID.toString())
      })
    }

    /** Update the in-memory list after saving the entity, including legacy rows without a Trakt ID. */
    function addToFavoritesList(serie, previousTraktId) {
      var index = service.favorites.findIndex(function(el) {
        return el === serie || (serie.TRAKT_ID != null && el.TRAKT_ID == serie.TRAKT_ID)
      })
      if (index === -1) {
        service.favorites.push(serie)
        if (serie.TRAKT_ID != null) service.favoriteIDs.push(serie.TRAKT_ID.toString())
      } else {
        service.favorites[index] = serie
        // TVDB-based updates can assign a new Trakt ID to an existing row.
        if (previousTraktId != serie.TRAKT_ID) refreshFavoriteIDs()
      }
    }

    /**
     * Helper function to map properties from the input data on a serie from Trakt.TV into a Serie CRUD object.
     * Input information will always overwrite existing information.
     * @param {Serie} serie the serie to update
     * @param {Object} data from trakt
     * @param {TMDBFanart} fanart
     */
    var fillSerie = function(serie, data, fanart) {
      data.TRAKT_ID = data.trakt_id
      data.TVDB_ID = data.tvdb_id
      data.TMDB_ID = data.tmdb_id
      data.TVRage_ID = data.tvrage_id
      data.IMDB_ID = data.imdb_id
      data.contentrating = data.certification
      data.name = data.title
      data.airs_dayofweek = data.airs.day
      data.airs_time = data.airs.time
      data.timezone = data.airs.timezone
      data.firstaired = new Date(data.first_aired).getTime()
      if (service.downloadRatings && (!serie.ratingcount || serie.ratingcount + 25 > data.votes)) {
        data.rating = Math.round(data.rating * 10)
        data.ratingcount = data.votes
      } else {
        delete data.rating
        delete data.ratingcount
      }
      data.genre = data.genres.join('|')
      data.lastupdated = data.updated_at
      if (serie.added == null) {
        data.added = new Date().getTime()
      }
      for (var i in data) {
        if ((i in serie)) {
          // if (serie[i] !== data[i]) console.debug('serie ' + i + '=[' + data[i] + ']')
          serie[i] = data[i]
        }
      }

      if (fanart) {
        serie.fanart = fanart.fanart
        serie.poster = fanart.poster
      }
    }
    /**
     * Apply Trakt metadata to an episode entity, then apply matching backup state.
     * A restore entry can identify the episode by TVDB or Trakt ID and can mark
     * it downloaded independently of its watched timestamp.
     */
    function fillEpisode(episode, data, season, serie, watched, sceneStillImage) {
      // remap some properties on the data object to make them easy to set with a for loop. the CRUD object doesn't persist properties that are not registered, so that's cheap.
      data.TVDB_ID = data.tvdb_id
      data.TMDB_ID = data.tmdb_id
      data.IMDB_ID = data.imdb_id
      data.TRAKT_ID = data.trakt_id
      if (service.downloadRatings && (!episode.ratingcount || episode.ratingcount + 25 > data.votes)) {
        data.rating = Math.round(data.rating * 10)
        data.ratingcount = data.votes
      } else {
        delete data.rating
        delete data.ratingcount
      }
      data.episodenumber = data.number
      data.episodename = (data.title == null) ? 'TBA' : data.title
      data.firstaired = new Date(data.first_aired).getTime()
      data.firstaired_iso = data.first_aired
      if (!episode.isLeaked() && (data.firstaired === 0 || data.firstaired > new Date().getTime())) {
        // if the episode has not yet aired, make sure the download and watched status are zeroed. #491
        // unless leaked
        data.downloaded = 0
        data.watched = 0
        data.watchedAt = null
      }
      data.absolute = (serie.isAnime()) ? data.number_abs : null

      episode.filename = sceneStillImage
      episode.seasonnumber = season.seasonnumber
      for (var i in data) {
        if ((i in episode)) {
          // if (episode[i] !== data[i]) console.debug('episode S' + episode.seasonnumber + 'E' + data.episodenumber  + ' ' + i + '=[' + data[i] + ']')
          episode[i] = data[i]
        }
      }
      watched.map(function(el) {
        if (('TVDB_ID' in el && el.TVDB_ID && el.TVDB_ID == episode.TVDB_ID) || ('TRAKT_ID' in el && el.TRAKT_ID && el.TRAKT_ID == episode.TRAKT_ID)) {
          episode.downloaded = el.downloaded
          episode.watchedAt = el.watchedAt
          if (el.watchedAt != null) {
            episode.watched = 1
          } else {
            episode.watched = 0
          }
        }
      })
      episode.ID_Serie = serie.getID()
      episode.ID_Season = season.getID()
      return episode
    }

    /**
     * Wipe episodes from the database that were cached locally but are no longer in the latest update.
     * @param object seasons Trakt.TV seasons/episodes input
     * @param object series serie entity
     */
    var cleanupEpisodes = function(seasons, serie) {
      var traktList = []
      seasons.map(function(season) {
        season.episodes.map(function(episode) {
          if (isNaN(parseInt(episode.trakt_id))) return
          traktList.push(episode.trakt_id)
        })
      })

      return CRUD.executeQuery('delete from Episodes where ID_Serie = ? and TRAKT_ID NOT IN (' + traktList.join(',') + ')', [serie.ID_Serie]).then(function(result) {
        if (result.rowsAffected > 0) {
          console.info('Cleaned up ' + result.rowsAffected + ' orphaned episodes for series [' + serie.ID_Serie + '] ' + serie.name)
        }
        return seasons
      })
    }

    /**
     * Insert all seasons into the database and return a cached array map
     * @param  CRUD.Entity serie serie to update seasons for
     * @param  object seasons extended seasons input data from Trakt
     * @return object seasonCache indexed by seasonnumber
     */
    async function updateSeasons(serie, seasons) {
      // console.debug("Update seasons!", seasons, fanart);
      const seasonCache = await serie.getSeasonsByNumber()

      await Promise.all(seasons.map(async season => {
        const SE = (season.number in seasonCache) ? seasonCache[season.number] : new Season()
        SE.poster = await FanartService.getSeasonPoster(season.tmdb_id)
        SE.seasonnumber = season.number
        SE.ID_Serie = serie.getID()
        SE.overview = season.overview
        SE.TRAKT_ID = season.trakt_id
        SE.TMDB_ID = season.tmdb_id
        if (service.downloadRatings && (!SE.ratingcount || SE.ratingcount + 25 > season.votes)) {
          SE.ratings = Math.round(season.rating * 10)
          SE.ratingcount = season.votes
        }
        seasonCache[season.number] = SE
        await SE.Persist()
      }))

      return seasonCache
    }

    /**
     * Save new and updated episodes and resolve to an entity map keyed by Trakt ID.
     * An optional progress callback receives (saved, total), starting at zero
     * and advancing after each episode write succeeds.
     */
    async function updateEpisodes(serie, seasons, watched, seasonCache, onEpisodeProgress) {
      let saved = 0
      const total = onEpisodeProgress ? seasons.reduce((count, season) => count + season.episodes.length, 0) : 0
      if (onEpisodeProgress) onEpisodeProgress(saved, total)
      const episodeCache = await serie.getEpisodesMap()

      await Promise.all(seasons.map(async season => {
        const episodeImages = await FanartService.getEpisodeImagesForSeason(serie.TMDB_ID, season.number)
        return Promise.all(season.episodes.map(async episode => {
          const dbEpisode = (!(episode.trakt_id in episodeCache)) ? new Episode() : episodeCache[episode.trakt_id]
          fillEpisode(dbEpisode, episode, seasonCache[season.number], serie, watched, episodeImages[episode.tmdb_id])
          await dbEpisode.Persist()
          if (onEpisodeProgress) onEpisodeProgress(++saved, total)
          episodeCache[episode.trakt_id] = dbEpisode
        }))
      }))

      return episodeCache
    }

    var service = {
      initialized: false,
      operationByTraktId: {},
      favorites: [],
      favoriteIDs: [],
      downloadRatings: $injector.get('SettingsService').get('download.ratings'), // determines if Ratings are processed or discarded

      /**
       * Add or refresh a show using its full Trakt response. For legacy restores,
       * `useTrakt_id` selects which ID to match against existing library rows.
       * `watched` contains optional episode state from the backup.
       *
       * Save the show and seasons before writing their episodes. Resolve to the
       * saved show after the episode writes and after notifying calendar and
       * watched count listeners. A failed later write can leave earlier rows saved.
       * @returns {Promise<Serie>}
       */
      addFavorite: async function(data, watched, useTrakt_id, updateImages, onEpisodeProgress) {
        watched = watched || []
        useTrakt_id = useTrakt_id || false

        if (!data || typeof data.title !== 'string' || !data.title.trim()) {
          throw new Error('Trakt returned show metadata without a title')
        }

        const existing = (useTrakt_id || data.tvdb_id == null) ? service.getByTRAKT_ID(data.trakt_id) : service.getByTVDB_ID(data.tvdb_id)
        const serie = existing || new Serie()
        const previousTraktId = serie.TRAKT_ID

        const showFanart = await FanartService.getShowImages(data, updateImages)
        fillSerie(serie, data, showFanart)
        await serie.Persist()

        addToFavoritesList(serie, previousTraktId)
        $rootScope.$applyAsync()
        await cleanupEpisodes(data.seasons, serie)
        const seasonCache = await updateSeasons(serie, data.seasons)
        const episodeCache = await updateEpisodes(serie, data.seasons, watched, seasonCache, onEpisodeProgress)

        $injector.get('CalendarEvents').processEpisodes(serie, episodeCache)
        // console.debug("FavoritesService.Favorites", service.favorites)
        $rootScope.$applyAsync()
        $rootScope.$broadcast('background:load', serie)
        $rootScope.$broadcast('storage:update')
        $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie)

        return serie
      },
      waitForInitialization: function() {
        return $q(function(resolve) {
          function waitForInitialize() {
            if (service.initialized) {
              resolve()
            } else {
              setTimeout(waitForInitialize, 50)
            }
          }
          waitForInitialize()
        })
      },
      /**
       * Load episodes between two inclusive epoch millisecond bounds. Wait for
       * the in-memory library to load so callers can resolve the returned shows.
       * Pass `options` through to CRUD for ordering and result limits.
       */
      getEpisodesForDateRange: function(start, end, options) {
        return service.waitForInitialization().then(function() {
          return CRUD.Find('Episode', [['Episodes.firstaired BETWEEN ? AND ?', start, end]], options)
        })
      },
      getByTVDB_ID: function(id) {
        return service.favorites.find(function(el) {
          return el.TVDB_ID == id
        })
      },
      getByTRAKT_ID: function(id) {
        return service.favorites.find(function(el) {
          return el.TRAKT_ID == id
        })
      },
      getByID_Serie: function(id) {
        return service.favorites.find(function(el) {
          return el.ID_Serie == id
        })
      },
      hasFavorite: function(id) {
        return service.favoriteIDs.indexOf(id.toString()) > -1
      },
      /**
       * Remove a serie, it's seasons, and it's episodes from the database.
       */
      remove: function(serie) {
        serie.displaycalendar = 0
        console.info('Remove serie from favorites!', serie)

        CRUD.executeQuery('delete from Seasons where ID_Serie = ' + serie.ID_Serie)
        CRUD.executeQuery('delete from Episodes where ID_Serie = ' + serie.ID_Serie)

        service.favoriteIDs = service.favoriteIDs.filter(function(id) {
          return id != serie.TRAKT_ID
        })

        if ('Delete' in serie) {
          serie.Delete().then(function() {
            service.favorites = service.favorites.filter(function(el) {
              return el.getID() != serie.getID()
            })

            console.info("Serie '" + serie.name + "' deleted. Syncing storage.")
            $rootScope.$broadcast('storage:update')

            if (service.favorites.length === 0) {
              $rootScope.$broadcast('serieslist:empty')
            }
          })
        }
        service.clearAdding(serie.TRAKT_ID)
      },
      refresh: function() {
        return service.getSeries().then(function(results) {
          service.favorites = results
          refreshFavoriteIDs()
          if (results.length === 0) {
            setTimeout(function() {
              $rootScope.$broadcast('serieslist:empty')
            }, 0)
          }
          return service.favorites
        })
      },
      /**
       * Fetch all the series asynchronously and return them as POJO's
       * (Plain Old Javascript Objects)
       * Runs automatically when this factory is instantiated
       */
      getSeries: function() {
        return CRUD.Find('Serie', ['name is not NULL'])
      },
      /**
       * Load a random background from the shows database
       * The BackgroundRotator service is listening for this event
       */
      loadRandomBackground: function() {
        // dafuq. no RANDOM() in sqlite in chrome...
        // then we pick a random array item from the resultset based on the amount.
        CRUD.executeQuery("select name, firstaired, fanart from Series where fanart != ''").then(function(result) {
          var item = result.rows[Math.floor(Math.random() * (result.rows.length - 1))]
          if (result.rows.length > 0) {
            $rootScope.$broadcast('background:load', item)
          }
        })
      },
      /**
       * Mark an add or restore in progress. Interactive adds provide their
       * promise so another request for the same show can await the same work.
       */
      adding: function(trakt_id, promise) {
        service.operationByTraktId[trakt_id] = {
          state: 'adding',
          error: null,
          promise: promise || null
        }
      },
      /**
       * End the add operation. The checkmark comes from library membership.
       */
      added: function(trakt_id) {
        service.operationByTraktId[trakt_id] = {
          state: 'idle',
          error: null,
          promise: null
        }
      },
      /**
       * flush the adding and error status list
       */
      flushAdding: function() {
        service.operationByTraktId = {}
      },
      /**
       * Check for an active add or restore, including restores with no shared promise.
       */
      isAdding: function(trakt_id) {
        if (trakt_id === null) return false
        return service.getOperation(trakt_id).state === 'adding'
      },
      /**
       * Used to show checkmarks in the add modes for series that you already have.
       */
      isAdded: function(trakt_id) {
        if (trakt_id === null) return false
        return service.hasFavorite(trakt_id.toString())
      },
      /**
       * clear the adding status for this series. used to indicate spinner and checkmark are NOT required.
       */
      clearAdding: function(trakt_id) {
        delete service.operationByTraktId[trakt_id]
      },
      /**
       * add the error status for this series. used to indicate sadface icon is required.
       */
      addError: function(trakt_id, error) {
        service.operationByTraktId[trakt_id] = {
          state: 'error',
          error: error,
          promise: null
        }
      },
      /**
       * Check whether the last add or restore for this show failed.
       */
      isError: function(trakt_id) {
        if (trakt_id === null) return false
        return service.getOperation(trakt_id).state === 'error'
      },
      /**
       * clear the error status for this series. used to indicate sadface icon is NOT required.
       */
      clearError: function(trakt_id) {
        if (service.isError(trakt_id)) service.added(trakt_id)
      },
      getOperation: function(trakt_id) {
        return service.operationByTraktId[trakt_id] || {
          state: 'idle',
          error: null,
          promise: null
        }
      }
    }

    return service
  }
])

DuckieTV.run(['FavoritesService', '$state', '$rootScope', function(FavoritesService, $state, $rootScope) {
  // console.log("Executing favoritesservice.run block");
  $rootScope.$on('serieslist:empty', function() {
    // console.log("Series list is empty!, going to add screen.");
    setTimeout(function() {
      $state.go('add_favorites')
    }, 500)
  })

  // console.log("Executing favoritesservice.refresh.");

  FavoritesService.refresh().then(function(favorites) {
    // console.log("Favoritesservice refreshed!");
    FavoritesService.loadRandomBackground()
    FavoritesService.initialized = true
  })
}])
