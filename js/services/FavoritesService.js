angular.module('DuckieTV.providers.favorites', [])
/**
 * Persistent storage for favorite series and episode
 *
 * Provides functionality to add and remove series and is the glue between Trakt.TV,
 * the EventScheduler Service and the GUI.
 */
.factory('FavoritesService', function($rootScope, AlarmService, TraktTV, EventSchedulerService, $q) {

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
        for (var i in data) {
            if (i == 'images') {
                serie.set('fanart', data[i].fanart);
                serie.set('poster', data[i].poster);
                serie.set('banner', data[i].banner);
            }
            if (i == 'first_aired') {
                serie.set('firstaired', data.first_aired_utc * 1000);
            } else if (i == 'ratings') {
                serie.set('rating', data.ratings.percentage);
                serie.set('ratingcount', data.ratings.votes);
            } else if (i == 'genres') {
                serie.set('genre', data.genres.join('|'));
            } else if (i == 'people') {
                serie.set('actors', data.people.actors.map(function(actor) {
                    return actor.name;
                }).join('|'));
            } else if (i == 'ended') {
                serie.set('status', data[i] == true ? 'Continuing' : 'Ended');
            } else if (i in mappings) {
                serie.set(mappings[i], data[i]);
            } else {
                serie.set(i, data[i]);
            }
        }
    };
    /**
     * Helper function to map properties from the input data from Trakt.TV into a Episode CRUD object.
     * Input information will always overwrite existing information.
     */
    fillEpisode = function(episode, d) {

        d.TVDB_ID = d.tvdb_id;
        d.rating = d.ratings.percentage;
        d.ratingcount = d.ratings.votes;
        d.episodenumber = d.episode;
        d.episodename = d.title;
        d.firstaired = d.first_aired_utc == 0 ? null : new Date(d.first_aired_iso).getTime();
        d.filename = d.screen;
        for (var i in d) {
            episode.set(i, d[i]);
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
            var d = $q.defer();
            service.getById(data.tvdb_id).then(function(serie) {
                if (!serie) {
                    serie = new Serie();
                }
                if (serie.getID() !== false && serie.name.toLowerCase() != data.title.toLowerCase()) {
                    console.log("Serie name has changed versus database name, removing it's updatecheck.");
                    EventSchedulerService.clear(serie.name + ' update check');
                }
                fillSerie(serie, data);
                serie.Persist().then(function(e) {
                    var updateInterval = serie.status.toLowerCase() == 'ended' ? 60 * 24 * 14 : 60 * 24 * 2; // schedule updates for ended series only every 2 weeks. Saves useless updates.

                    EventSchedulerService.createInterval(serie.name + ' update check', updateInterval, 'favoritesservice:checkforupdates', {
                        ID: serie.getID(),
                        TVDB_ID: serie.TVDB_ID
                    });
                    if (service.favorites.filter(function(el) {
                        return el.TVDB_ID == serie.TVDB_ID;
                    }).length == 0) {
                        service.favorites.push(serie);
                    } else {
                        service.favorites.map(function(el, index) {
                            if (el.TVDB_ID == serie.TVDB_ID) {
                                service.favorites[index] = serie;
                            }
                        });
                    }
                    $rootScope.$broadcast('background:load', serie.fanart);

                    service.updateEpisodes(serie, data.seasons, watched).then(function(result) {
                        $rootScope.$broadcast('episodes:updated', service.favorites);
                        console.log("Adding serie completely done, broadcasting storage sync event.");
                        $rootScope.$broadcast('storage:update');
                        d.resolve(serie);
                    }, function(err) {
                        console.log("Error updating episodes!");

                        d.reject(err);
                    }, function(notify) {

                        console.log('Service update episodes progress notification event for ', serie, notify);
                    });
                });
            });
            return d.promise;
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

            var seasonCache = {};
            var p = $q.defer();
            var totalEpisodes = 0;
            var updatedEpisodes = 0;
            seasons.map(function(s) { // keep track of the total number of episodes for all seasons, so that we know when all promises have finished.
                totalEpisodes += s.episodes.length;
            });
            return serie.getSeasons().then(function(sea) { // fetch the seasons and cache them by number.
                sea.map(function(el) {
                    seasonCache[el.seasonnumber] = el;
                });

            }).then(function() {

                return serie.getEpisodes().then(function(data) { // then fetch the episodes and put them in a big cache object
                    var cache = {};

                    data.map(function(episode) {
                        cache[episode.TVDB_ID] = episode;
                    });
                    data = null;

                    var pq = [];
                    cleanOldSeries(seasons, serie.getID());

                    return $q.all(seasons.map(function(season) {

                        var SE = (season.season in seasonCache) ? seasonCache[season.season] : new Season();

                        for (var s in season) { // update the season's properties
                            if (s == 'episodes') continue;
                            SE.set(s, season[s]);
                        }
                        SE.set('seasonnumber', season.season);
                        SE.set('ID_Serie', serie.getID());
                        SE.episodes = season.episodes;

                        return SE.Persist().then(function(r) {

                            return $q.all(SE.episodes.map(function(episode, idx) { // update the season's episodes
                                var e = (!(episode.tvdb_id in cache)) ? new Episode() : cache[episode.tvdb_id];
                                fillEpisode(e, episode);
                                e.seasonnumber = season.season;
                                e.ID_Serie = serie.getID();
                                e.ID_Season = SE.getID();
                                // if there's an entry for the episode in watchedEpisodes, this is a backup restore
                                var watchedEpisodes = watched.filter(function(el) {
                                    return el.TVDB_ID == e.TVDB_ID;
                                });
                                if (watchedEpisodes.length > 0) {
                                    e.set('watched', '1');
                                    e.set('watchedAt', watchedEpisodes[0].watchedAt);
                                }

                                // save the changes and free some memory, or do it immediately if there's no promise to wait for
                                if (Object.keys(e.changedValues).length > 0) { // if the dbObject is dirty, we wait for the persist to resolve
                                    return e.Persist();
                                } else {
                                    return true;
                                }
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