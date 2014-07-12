angular.module('DuckieTV.providers.favorites', [])
/**
 * Persistent storage for favorite series and episode
 *
 * Provides functionality to add and remove series and is the glue between Trakt.TV,
 * the EventScheduler Service and the GUI.
 */
.factory('FavoritesService', function($rootScope, TraktTV, EventSchedulerService, $q) {

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
            'air_day': 'airs_dayofweek',
            'air_time': 'airs_time',
            'country': 'language'
        }
        for (var i in data) {
            if (i == 'images') {
                serie.set('fanart', data[i].fanart);
                serie.set('poster', data[i].poster);
                serie.set('banner', data[i].banner);
            }
            if (i == 'first_aired') {
                serie.set('firstaired', data.first_aired * 1000);
            } else if (i == 'ratings') {
                serie.set('rating', data.ratings.percentage);
                serie.set('ratingcount', data.ratings.votes);
            } else if (i == 'genres') {
                serie.set('genre', data.genres.join('|'));
            } else if (i == 'people') {
                serie.set('actors', data.people.actors.map(function(actor) {
                    return actor.name
                }).join('|'));
            } else if (i == 'ended') {
                serie.set('status', data[i] == true ? 'Continuing' : 'Ended')
            } else if (i in mappings) {
                serie.set(mappings[i], data[i])
            } else {
                serie.set(i, data[i]);
            }
        }
    }
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
    }

    var service = {
        favorites: [],
        favoriteIDs: [],
        TraktTV: TraktTV,
        /**
         * Handles adding (and updating) a show to the local database.
         * Grabs the existing serie,seasons and episode from the database if they exist
         * and inserts or updates the information.
         * It also registers the serie with the EventScheduler service to check for updates
         * every two days.
         * Returns a promise that gets resolved when all the updates have been launched
         * (but not neccesarily finished, they'll continue to run)
         *
         * @param object data input data from TraktTV.findSerieByTVDBID(data.TVDB_ID)
         * @param object watched { TVDB_ID => watched episodes } mapped object to auto-mark as watched
         */
        addFavorite: function(data, watched) {
            console.log("FavoritesService.addFavorite!", data, watched);
            watched = watched || [];
            var d = $q.defer();
            service.getById(data.tvdb_id).then(function(serie) {
                if (!serie) {
                    serie = new Serie();
                }
                fillSerie(serie, data);
                serie.Persist().then(function(e) {
                    EventSchedulerService.createInterval(serie.get('name') + ' update check', 60 * 48, 'favoritesservice:checkforupdates', {
                        ID: serie.getID(),
                        TVDB_ID: serie.get('TVDB_ID')
                    });
                    if (service.favorites.filter(function(el) {
                        return el.TVDB_ID == serie.get('TVDB_ID');
                    }).length == 0) {
                        service.favorites.push(serie.asObject());
                    } else {
                        service.favorites.map(function(el, index) {
                            if (el.TVDB_ID == serie.get('TVDB_ID')) {
                                service.favorites[index] = serie.asObject();
                            }
                        })
                    }
                    $rootScope.$broadcast('background:load', serie.get('fanart'));

                    service.updateEpisodes(serie, data.seasons, watched).then(function(result) {
                        $rootScope.$broadcast('episodes:updated', service.favorites);
                        d.resolve(serie);
                    }, function(err) {
                        console.log("Errorr updating episodes!");
                        debugger;
                        d.reject(err);
                    }, function(notify) {
                        debugger;
                        console.log('Service update episodes progress notification event for ', serie, notify);
                    });
                });
            });
            return d.promise;
        },
        /**
         * Update the episodes and seasons attached to a serie.
         * Builds a cache of seasons and episodes to make sure existing
         * information is updated.
         * If an episodes' TVDB_ID is matched in the watched object, it's marked
         * as watched as well.
         *
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
            serie.getSeasons().then(function(sea) { // fetch the seasons and cache them by number.
                sea.map(function(el) {
                    seasonCache[el.get('seasonnumber')] = el;
                })

            }).then(function() {

                serie.getEpisodes().then(function(data) { // then fetch the episodes and put them in a big cache object
                    var cache = {};

                    data.map(function(episode) {
                        cache[episode.get('TVDB_ID')] = episode;
                    });
                    data = null;

                    var pq = [];
                    seasons.map(function(season) {
                        var SE = (season.season in seasonCache) ? seasonCache[season.season] : new Season();

                        for (var s in season) { // update the season's properties
                            if (s == 'episodes') continue;
                            SE.set(s, season[s]);
                        }
                        SE.set('seasonnumber', season.season);
                        SE.set('ID_Serie', serie.getID());
                        SE.episodes = season.episodes;

                        SE.Persist().then(function(r) {
                            SE.episodes.map(function(episode, idx) { // update the season's episodes
                                var e = (!(episode.tvdb_id in cache)) ? new Episode() : cache[episode.tvdb_id];
                                fillEpisode(e, episode);
                                e.set('seasonnumber', season.season);
                                e.set('ID_Serie', serie.getID());
                                e.set('ID_Season', SE.getID());
                                // if there's an entry for the episode in watchedEpisodes, this is a backup restore
                                var watchedEpisodes = watched.filter(function(el) {
                                    return el.TVDB_ID == e.get('TVDB_ID');
                                });
                                if (watchedEpisodes.length > 0) {
                                    e.set('watched', '1');
                                    e.set('watchedAt', watchedEpisodes[0].watchedAt);
                                }
                                // save the changes and fee some memory, or do it immediately if there's no promise to wait for
                                if (Object.keys(e.changedValues).length > 0) { // if the dbObject is dirty, we wait for the persist to resolve
                                    e.Persist().then(function(res) {
                                        updatedEpisodes++;
                                        if (updatedEpisodes == totalEpisodes) { // when all episodes are done, resolve the promise.
                                            if (service.favoriteIDs.indexOf(serie.get('TVDB_ID')) == -1) {
                                                service.favoriteIDs.push(serie.get('TVDB_ID'));
                                            }
                                            p.resolve();
                                        }
                                        cache[episode.tvdb_id] = null;
                                        e = null;
                                        episode = null;
                                    }, function(err) {
                                        console.error("PERSIST ERROR!", err);
                                    });
                                } else { // nothing has changed here, update the counter and continue or resolve.
                                    updatedEpisodes++;
                                    e = null;
                                    cache[episode.tvdb_id] = null;
                                    episode = null;
                                    if (updatedEpisodes == totalEpisodes) { // when all episodes are done, resolve the promise.
                                        if (service.favoriteIDs.indexOf(serie.get('TVDB_ID')) == -1) {
                                            service.favoriteIDs.push(serie.get('TVDB_ID'));
                                        }
                                        p.resolve();
                                    }
                                }
                            });
                            SE.episodes = null;
                            SE = null;
                            seasonCache[season.season] = null;
                            season = null;
                        });
                    })
                })

            });
            return p.promise;
        },

        /**
         * Helper function to fetch all the episodes for a serie
         * Optionaly, filters can be provided which will be turned into an SQL where.
         */
        getEpisodes: function(serie, filters) {
            serie = serie instanceof CRUD.Entity ? serie : this.getById(serie);
            return serie.Find('Episode', filters || {}).then(function(episodes) {
                return episodes.map(function(val, id) {
                    return val.asObject()
                });
            }, function(err) {
                console.log("Error in getepisodes!", serie, filters || {});
            });
        },
        getEpisodesForDateRange: function(start, end) {
            return CRUD.Find('Episode', ['firstaired > "' + start + '" AND firstaired < "' + end + '"']).then(function(ret) {
                return ret;
            })
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
            this.getById(serie['TVDB_ID']).then(function(s) {
                s.Find('Season').then(function(seasons) {
                    seasons.map(function(el) {
                        el.Delete();
                    });
                });
                CRUD.EntityManager.getAdapter().db.execute('delete from Episodes where ID_Serie = ' + serie.ID_Serie).then(function() {
                    s.Delete();

                    setTimeout(function() {
                        $rootScope.$broadcast('calendar:clearcache');
                        $rootScope.$broadcast('storage:update');
                        service.restore();
                    }.bind(this), 200);
                });


                CRUD.FindOne('ScheduledEvent', {
                    name: serie.name + ' update check'
                }).then(function(timer) {
                    if (timer) {
                        timer.Delete();
                    }
                });
                chrome.alarms.clear(serie.name + ' update check');
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
                var favorites = [];
                for (var i = 0; i < results.length; i++) {
                    favorites.push(results[i].asObject());
                }
                d.resolve(favorites);
            });
            return d.promise;
        },
        /**
         * Load a random background from the shows database
         * The BackgroundRotator service is listening for this event
         */
        loadRandomBackground: function() {
            $rootScope.$broadcast('background:load', service.favorites[Math.floor(Math.random() * service.favorites.length)].fanart);
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
        }
    };
    service.restore();
    return service;
})