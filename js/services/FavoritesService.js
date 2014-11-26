angular.module('DuckieTV.providers.favorites', [])
/**
 * Persistent storage for favorite series and episode
 *
 * Provides functionality to add and remove series and is the glue between Trakt.TV,
 * the EventScheduler Service and the GUI.
 */
.factory('FavoritesService', function($rootScope, AlarmService, TraktTV, EventSchedulerService, $q) {

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
    };


    /**
     * Helper function to map properties from the input data on a serie from Trakt.TV into a Serie CRUD object.
     * Input information will always overwrite existing information.
     */
    fillSerie = function(serie, data) {
        var mappings = {
            'tvdb_id': 'TVDB_ID',
            'tvrage_id': 'TVRage_ID',
            'imdb_id': 'IMDB_ID',
            'certification': 'contentrating',
            'title': 'name',
            'air_day_utc': 'airs_dayofweek',
            'air_time_utc': 'airs_time',
            'country': 'language'
        };
        if ('images' in data) {
            data.fanart = data.images.fanart;
            data.poster = data.images.poster;
            data.banner = data.images.banner;
        }
        data.firstaired = data.first_aired_utc * 1000;
        data.rating = data.ratings.percentage;
        data.ratingcount = data.ratings.votes;
        data.genre = data.genres.join('|');
        data.actors = data.people.actors.map(function(actor) {
            return actor.name;
        }).join('|');
        data.status = data.ended === true ? 'Ended' : 'Continuing';

        for (var i in data) {
            serie.set(i, data[i]);
        }
    };
    /**
     * Helper function to map properties from the input data from Trakt.TV into a Episode CRUD object.
     * Input information will always overwrite existing information.
     */
    fillEpisode = function(episode, data, season, watched) {
        // remap some properties on the data object to make them easy to set with a for loop. the CRUD object doesn't persist properties that are not registered, so that's cheap.
        data.TVDB_ID = data.tvdb_id;
        data.rating = data.ratings.percentage;
        data.ratingcount = data.ratings.votes;
        data.episodenumber = data.episode;
        data.episodename = data.title;
        data.firstaired = data.first_aired_utc == 0 ? null : new Date(data.first_aired_iso).getTime();
        data.filename = data.screen;

        for (var i in data) {
            episode.set(i, data[i]);
        }
        episode.seasonnumber = season.season;
        // if there's an entry for the episode in watchedEpisodes, this is a backup restore
        var watchedEpisodes = watched.filter(function(el) {
            return el.TVDB_ID == e.TVDB_ID;
        });
        if (watchedEpisodes.length > 0) {
            episode.set('watched', '1');
            episode.set('watchedAt', watchedEpisodes[0].watchedAt);
        }
    };

    /**
     * Wipe episodes from the database that were cached locally but are no longer in the latest update.
     * @var series Trakt.TV series input
     * @var ID int DuckieTV ID_Serie
     */
    cleanOldSeries = function(seasons, ID) {
        var tvdbList = [];
        seasons.map(function(season) {
            season.episodes.map(function(episode) {
                tvdbList.push(episode.tvdb_id);
            });
        });
        CRUD.EntityManager.getAdapter().db.execute('delete from Episodes where ID_Serie = ? and TVDB_ID NOT IN (' + tvdbList.join(',') + ')', [ID]).then(function(result) {
            console.log("Cleaned up", result.rs.rowsAffected, "orphaned episodes");
        });
        tvdbList = null;
    };


    var service = {
        favorites: [],
        favoriteIDs: [],
        TraktTV: TraktTV,
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
            console.log("FavoritesService.addFavorite!", data, watched);
            return service.getById(data.tvdb_id).then(function(serie) {
                if (!serie) {
                    serie = new Serie();
                } else if (serie.name.toLowerCase() != data.title.toLowerCase()) { // remove update checks for series that have their name changed (will be re-added with new name)
                    EventSchedulerService.clear(serie.name + ' update check');
                }
                fillSerie(serie, data);
                return serie.Persist().then(function(e) {
                    // schedule updates for ended series only every 2 weeks. Saves useless updates otherwise update every 2 days.
                    EventSchedulerService.createInterval(serie.name + ' update check', serie.status.toLowerCase() == 'ended' ? 60 * 24 * 14 : 60 * 24 * 2, 'favoritesservice:checkforupdates', {
                        ID: serie.getID(),
                        TVDB_ID: serie.TVDB_ID
                    });
                    addToFavoritesList(serie); // cache serie in favoritesservice.favorites
                    $rootScope.$broadcast('background:load', serie.fanart);
                    return service.updateEpisodes(serie, data.seasons, watched).then(function(result) { // add serie completely done, broadcast sync and update event.
                        console.log("Adding serie completely done, broadcasting storage sync event.");
                        $rootScope.$broadcast('episodes:updated', service.favorites);
                        $rootScope.$broadcast('storage:update');
                        return result;
                    });
                });
            });

        },
        /**
         * Update the episodes and seasons attached to a serie.
         * Builds a cache of seasons and episodes from the database to make sure existing
         * information is updated.
         * If an episodes' TVDB_ID is matched in the watched object, it's marked
         * as watched as well.
         * If an episode in the database is no longer at TraktTV then it gets deleted.
         */
        updateEpisodes: function(serie, seasons, watched) {
            watched = watched || [];

            return serie.getSeasonsByNumber().then(function(seasonCache) { // fetch the seasons and cache them by number.

                return serie.getEpisodesMap().then(function(cache) { // then fetch the episodes already existing mapped by tvdb_id as cache object

                    cleanOldSeries(seasons, serie.getID()); // clean up episodes from the database that were saved but are no longer in the latest update

                    return $q.all(seasons.map(function(season) {

                        var SE = (season.season in seasonCache) ? seasonCache[season.season] : new Season();
                        for (var s in season) { // update the season's properties
                            SE[s] = season[s];
                        }
                        SE.seasonnumber = season.season;
                        SE.ID_Serie = serie.getID();

                        return SE.Persist().then(function(r) {

                            return $q.all(SE.episodes.map(function(episode, idx) { // update the season's episodes
                                var e = (!(episode.tvdb_id in cache)) ? new Episode() : cache[episode.tvdb_id];
                                fillEpisode(e, episode, season, watched);
                                e.ID_Serie = serie.getID();
                                e.ID_Season = SE.getID();
                                return e.Persist();
                            }));
                        });
                    }));
                });
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
                console.log("Error in getEpisodes!", serie, filters || {});
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
            return service.favorites.filter(function(el) {
                return el.TVDB_ID.toString() == id.toString();
            }).length > 0;
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
                    console.log("Serie deleted. Syncing storage.");

                    $rootScope.$broadcast('storage:update');
                    service.refresh();

                });


                CRUD.FindOne('ScheduledEvent', {
                    name: serie.name + ' update check'
                }).then(function(timer) {
                    if (timer) {
                        timer.Delete();
                    }
                });
                AlarmService.clear(serie.name + ' update check');
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
            var d = $q.defer();
            CRUD.Find('Serie', {}).then(function(results) {
                results.map(function(el, idx) {
                    results[idx] = el;
                });
                d.resolve(results);
            });
            return d.promise;
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
                    $rootScope.$broadcast('background:load', result.rs.rows.item(Math.floor(Math.random() * (result.rs.rows.length - 1)) + 1).fanart);
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
                TraktTV.enableBatchMode().findSerieByTVDBID(data.TVDB_ID).then(function(res) {
                    service.addFavorite(res);
                });

            });
            service.refresh();
        }
    };
    service.restore();
    return service;
});