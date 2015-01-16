angular.module('DuckieTV.providers.favorites', ['DuckieTV.providers.alarms', 'DuckieTV.providers.eventscheduler'])
/**
 * Persistent storage for favorite series and episode
 *
 * Provides functionality to add and remove series and is the glue between Trakt.TV,
 * the EventScheduler Service and the GUI.
 */
.factory('FavoritesService', function($rootScope, AlarmService, EventSchedulerService, TraktTVv2) {

    /** 
     * Helper function to add a serie to the service.favorites hash if it doesn't already exist.
     * update existing otherwise.
     */
    addToFavoritesList = function(serie) {
        var existing = service.favorites.filter(function(el) {
            return el.TVDB_ID == serie.TVDB_ID;
        });
        if (existing.length === 0) {
            service.favorites.push(serie);
        } else {
            service.favorites[service.favorites.indexOf(existing[0])] = serie;
        }
        service.favoriteIDs.push(serie.TVDB_ID.toString());

    };


    /**
     * Helper function to map properties from the input data on a serie from Trakt.TV into a Serie CRUD object.
     * Input information will always overwrite existing information.
     */
    fillSerie = function(serie, data) {
        data.TVDB_ID = data.tvdb_id;
        data.TVRage_ID = data.tvrage_id;
        data.IMDB_ID = data.imdb_id;
        data.contentrating = data.certification;
        data.name = data.title;
        data.airs_dayofweek = data.airs.day;
        data.airs_time = data.airs.time;
        data.language = data.country;


        data.firstaired = new Date(data.first_aired).getTime();
        data.rating = Math.round(data.rating * 10);
        data.ratingcount = data.votes;
        data.genre = data.genres.join('|');
        if (data.people && 'actors' in data.people) {
            data.actors = data.people.actors.map(function(actor) {
                return actor.name;
            }).join('|');
        }
        switch (data.status.toLowerCase()) {
            case 'ended':
            case 'canceled':
                data.status = 'Ended';
                break;
            default:
                data.status = 'Continuing';
        }

        for (var i in data) {
            if (serie.hasField(i)) {
                serie[i] = data[i];
            }
        }
    };
    /**
     * Helper function to map properties from the input data from Trakt.TV into a Episode CRUD object.
     * Input information will always overwrite existing information.
     */
    fillEpisode = function(episode, data, season, serie, watched) {
        // remap some properties on the data object to make them easy to set with a for loop. the CRUD object doesn't persist properties that are not registered, so that's cheap.
        data.TVDB_ID = data.tvdb_id;
        data.ratingcount = data.votes;
        data.rating = Math.round(data.rating * 10);
        data.episodenumber = data.number;
        data.episodename = data.title;
        data.firstaired = new Date(data.first_aired).getTime();
        data.filename = 'screenshot' in data && 'thumb' in data.screenshot ? data.screenshot.thumb : '';

        for (var i in data) {
            if (episode.hasField(i)) {
                episode[i] = data[i];
            }
        }
        episode.seasonnumber = season.seasonnumber;
        // if there's an entry for the episode in watchedEpisodes, this is a backup restore
        watched.map(function(el) {
            if (el.TVDB_ID == episode.TVDB_ID) {
                episode.watchedAt = el.watchedAt;
                episode.watched = '1';
            }
        });
        episode.ID_Serie = serie.getID();
        episode.ID_Season = season.getID();
        return episode;
    };


    /**
     * Wipe episodes from the database that were cached locally but are no longer in the latest update.
     * @var series Trakt.TV series input
     * @var ID int DuckieTV ID_Serie
     */
    cleanupEpisodes = function(seasons, ID) {
        var tvdbList = [];
        seasons.map(function(season) {
            season.episodes.map(function(episode) {
                if (isNaN(parseInt(episode.tvdb_id))) return;
                tvdbList.push(episode.tvdb_id);
            });
        });

        return CRUD.EntityManager.getAdapter().db.execute('delete from Episodes where ID_Serie = ? and TVDB_ID NOT IN (' + tvdbList.join(',') + ')', [ID]).then(function(result) {
            console.log("Cleaned up " + result.rs.rowsAffected + " orphaned episodes");
            return seasons;
        });
    };

    /**
     * Insert all seasons into the database and return a cached array map
     * @param  CRUD.Entity serie serie to update seasons for
     * @param  object seasons extended seasons input data from Trakt
     * @return object seasonCache indexed by seasonnumber
     */
    updateSeasons = function(serie, seasons) {
        //console.log("Update seasons!", seasons);
        return serie.getSeasonsByNumber().then(function(seasonCache) { // fetch the seasons and cache them by number.
            return Promise.all(seasons.map(function(season) {
                var SE = (season.number in seasonCache) ? seasonCache[season.number] : new Season();
                SE.poster = season.poster;
                SE.seasonnumber = season.number;
                SE.ID_Serie = serie.getID();
                seasonCache[season.number] = SE;
                return SE.Persist().then(function() {
                    return true;
                });
            })).then(function() {
                return seasonCache;
            });
        });
    };

    updateEpisodes = function(serie, seasons, watched, seasonCache) {
        // console.log(" Update episodes!", serie, seasons, watched, seasonCache);
        return serie.getEpisodesMap().then(function(episodeCache) {
            return Promise.all(seasons.map(function(season) {
                return Promise.all(season.episodes.map(function(episode) {
                    var dbEpisode = (!(episode.tvdb_id in episodeCache)) ? new Episode() : episodeCache[episode.tvdb_id];
                    return fillEpisode(dbEpisode, episode, seasonCache[season.number], serie, watched).Persist();
                })).then(function() {
                    return seasonCache;
                });
            }));
        });
    };

    var service = {
        favorites: [],
        favoriteIDs: [],
        // TraktTV: TraktTV,
        /**
         * Handles adding, deleting and updating a show to the local database.
         * Grabs the existing serie, seasons and episode from the database if they exist
         * and inserts or updates the information.
         * Deletes the episode from the database if TraktTV no longer has it.
         * It also registers the serie with the EventScheduler service to check for updates
         * every two days.
         * Returns a promise that gets resolved when all the updates have been launched
         * (but not necessarily finished, they'll continue to run)
         *
         * @param object data input data from TraktTV.findSerieByTVDBID(data.TVDB_ID)
         * @param object watched { TVDB_ID => watched episodes } mapped object to auto-mark as watched
         */
        addFavorite: function(data, watched) {
            watched = watched || [];
            // console.log("FavoritesService.addFavorite!", data, watched);
            var entity = null;
            if (data.title == null || data.tvdb_id == null) { // if odd invalid data comes back from trakt.tv, remove the whole serie from db.
                console.error("received error data as input, removing from favorites.");
                return service.remove({
                    name: data.title,
                    TVDB_ID: data.tvdb_id
                });
            }
            return service.getById(data.tvdb_id).then(function(serie) {
                    console.log("Favoritesservice.getbyid executed: ", serie);
                    if (!serie) {
                        serie = new Serie();
                    } else if (serie.name.toLowerCase() != data.title.toLowerCase()) { // remove update checks for series that have their name changed (will be re-added with new name)
                        EventSchedulerService.clear(serie.name + ' [' + serie.TVDB_ID + ']');
                    }
                    fillSerie(serie, data);
                    EventSchedulerService.clear(serie.name + ' update check'); // clean up old format.  
                    EventSchedulerService.createInterval(serie.name + ' [' + serie.TVDB_ID + ']', serie.status.toLowerCase() == 'ended' ? 60 * 24 * 14 : 60 * 24 * 2, 'favoritesservice:checkforupdates', {
                        ID: serie.getID(),
                        TVDB_ID: serie.TVDB_ID
                    });
                    return serie.Persist().then(function() {
                        return serie;
                    });
                }).then(function(serie) {
                    addToFavoritesList(serie); // cache serie in favoritesservice.favorites
                    $rootScope.$broadcast('background:load', serie.fanart);
                    entity = serie;
                    return cleanupEpisodes(data.seasons, entity);
                })
                .then(function() {
                    return updateSeasons(entity, data.seasons);
                })
                .then(function(seasonCache) {
                    return updateEpisodes(entity, data.seasons, watched, seasonCache);
                })
                .then(function() {
                    $rootScope.$broadcast('episodes:updated', service.favorites);
                    $rootScope.$broadcast('storage:update');
                    return entity;
                });

        },

        /**
         * Helper function to fetch all the episodes for a serie
         * Optionally, filters can be provided which will be turned into an SQL where.
         */
        getEpisodes: function(serie, filters) {
            serie = serie instanceof CRUD.Entity ? serie : this.getById(serie);
            return serie.Find('Episode', filters || {}).then(function(episodes) {
                return episodes;
            }, function(err) {
                console.error("Error in getEpisodes", serie, filters || {});
            });
        },
        getEpisodesForDateRange: function(start, end) {
            var filter = ['Episodes.firstaired > "' + start + '" AND Episodes.firstaired < "' + end + '" '];
            filter.Serie = {
                'displaycalendar': 1
            };
            if (!$rootScope.getSetting('calendar.show-specials')) {
                filter.push('seasonnumber > 0');
            }
            return CRUD.Find('Episode', filter).then(function(ret) {
                return ret;
            });
        },
        /**
         * Find a serie by it's TVDB_ID (the main identifier for series since they're consistent regardless of local config)
         */
        getById: function(id) {
            return CRUD.FindOne('Serie', {
                'TVDB_ID': id
            });
        },
        hasFavorite: function(id) {
            return service.favoriteIDs.indexOf(id) > -1;
        },
        /**
         * Remove a serie, it's seasons, it's episodes and it's timers from the database.
         * Also removes the chrome alarm that fires the update check
         */
        remove: function(serie) {
            console.log("Remove serie from favorites!", serie);
            this.getById(serie.TVDB_ID).then(function(s) {
                s.Find('Season').then(function(seasons) {
                    seasons.map(function(el) {
                        el.Delete();
                    });
                });
                CRUD.EntityManager.getAdapter().db.execute('delete from Episodes where ID_Serie = ' + serie.ID_Serie);
                s.Delete().then(function() {
                    $rootScope.$broadcast('calendar:clearcache');
                    console.log("Serie '" + serie.name + "' deleted. Syncing storage.");

                    $rootScope.$broadcast('storage:update');
                    service.refresh();

                });


                CRUD.FindOne('ScheduledEvent', {
                    name: serie.name + ' [' + serie.TVDB_ID + ']'
                }).then(function(timer) {
                    if (timer) {
                        timer.Delete();
                    }
                });
                AlarmService.clear(serie.name + ' [' + serie.TVDB_ID + ']');
            });
        },
        refresh: function() {
            service.getSeries().then(function(results) {
                service.favorites = results;
                var ids = [];
                results.map(function(el) {
                    ids.push(el.TVDB_ID.toString());
                });
                service.favoriteIDs = ids;
                $rootScope.$broadcast('favorites:updated', service.favorites);
                $rootScope.$broadcast('episodes:updated');
            });
        },
        /**
         * Fetch all the series asynchronously and return them as POJO's
         * (Plain Old Javascript Objects)
         * Runs automatically when this factory is instantiated
         */
        getSeries: function() {
            return CRUD.Find('Serie', {}).then(function(results) {
                results.map(function(el, idx) {
                    results[idx] = el;
                });
                return results;
            });
        },
        /**
         * Load a random background from the shows database
         * The BackgroundRotator service is listening for this event
         */
        loadRandomBackground: function() {
            // dafuq. no RANDOM() in sqlite in chrome... 
            // then we pick a random array item from the resultset based on the amount.
            CRUD.EntityManager.getAdapter().db.execute("select fanart from series where fanart != ''").then(function(result) {
                if (result.rs.rows.length > 0) {
                    $rootScope.$broadcast('background:load', result.rs.rows.item(Math.floor(Math.random() * (result.rs.rows.length - 1))).fanart);
                }
            });

        },
        /**
         * Fetch stored series from sqlite and store them in service.favorites
         * Notify anyone listening by broadcasting favorites:updated
         * Also starts the listener for favoritesservice:checkforupdates
         */
        restore: function() {
            $rootScope.$on('favoritesservice:checkforupdates', function(evt, data) {
                TraktTVv2.resolveTVDBID(data.TVDB_ID).then(function(searchResult) {
                    return TraktTVv2.serie(searchResult.slug_id);
                }).then(service.addFavorite);
            });
            service.refresh();
        }
    };
    service.restore();
    return service;
});