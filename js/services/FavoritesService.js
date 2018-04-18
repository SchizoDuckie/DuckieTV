/**
 * Persistent storage for favorite series and episode
 *
 * Provides functionality to add and remove series and is the glue between Trakt.TV,
 */
DuckieTV.factory('FavoritesService', ["$q", "$rootScope", "FanartService", "$injector",
    function($q, $rootScope, FanartService, $injector) {

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
        fillSerie = function(serie, data, fanart) {
            data.TVDB_ID = data.tvdb_id;
            data.TVRage_ID = data.tvrage_id;
            data.IMDB_ID = data.imdb_id;
            data.TRAKT_ID = data.trakt_id;
            data.contentrating = data.certification;
            data.name = data.title;
            data.airs_dayofweek = data.airs.day;
            data.airs_time = data.airs.time;
            data.timezone = data.airs.timezone;
            data.firstaired = new Date(data.first_aired).getTime();
            if (service.downloadRatings && (!serie.ratingcount || serie.ratingcount + 25 > data.votes)) {
                data.rating = Math.round(data.rating * 10);
                data.ratingcount = data.votes;
            } else {
                delete data.rating;
                delete data.ratingcount;
            }
            data.genre = data.genres.join('|');
            data.lastupdated = data.updated_at;
            if (data.people && 'cast' in data.people) {
                data.actors = data.people.cast.map(function(actor) {
                    if ('character' in actor && actor.character != '') {
                        return actor.person.name + ' (' + actor.character + ')';
                    } else {
                        return actor.person.name;
                    }
                }).join('|');
            }
            if (serie.added == null) {
                data.added = new Date().getTime();
            }
            for (var i in data) {
                if ((i in serie)) {
                    serie[i] = data[i];
                }
            }
            if (null !== fanart) {
                if ('tvbanner' in fanart) {
                    serie.banner = fanart.tvbanner[0].url;
                }
                if (!('showbackground' in fanart) && ('hdclearart' in fanart)) {
                    serie.fanart = fanart.hdclearart[0].url;
                }
                if ('showbackground' in fanart) {
                    serie.fanart = fanart.showbackground[0].url;
                }
                if (!('tvposter' in fanart) && !('clearlogo' in fanart) && ('hdtvlogo' in fanart)) {
                    serie.poster = fanart.hdtvlogo[0].url;
                }
                if (!('tvposter' in fanart) && ('clearlogo' in fanart)) {
                    serie.poster = fanart.clearlogo[0].url;
                }
                if ('tvposter' in fanart) {
                    serie.poster = fanart.tvposter[0].url.replace('/fanart', '/preview');
                }
            }
        };
        /**
         * Helper function to map properties from the input data from Trakt.TV into a Episode CRUD object.
         * Input information will always overwrite existing information.
         */
        fillEpisode = function(episode, data, season, serie, watched, fanart) {
            // remap some properties on the data object to make them easy to set with a for loop. the CRUD object doesn't persist properties that are not registered, so that's cheap.
            data.TVDB_ID = data.tvdb_id;
            data.IMDB_ID = data.imdb_id;
            data.TRAKT_ID = data.trakt_id;
            if (service.downloadRatings && (!episode.ratingcount || episode.ratingcount + 25 > data.votes)) {
                data.rating = Math.round(data.rating * 10);
                data.ratingcount = data.votes;
            } else {
                delete data.rating;
                delete data.ratingcount;
            }
            data.episodenumber = data.number;
            data.episodename = (data.title == null) ? 'TBA' : data.title;
            data.firstaired = new Date(data.first_aired).getTime();
            data.firstaired_iso = data.first_aired;
            if (!episode.isLeaked() && (data.firstaired === 0 || data.firstaired > new Date().getTime())) {
                // if the episode has not yet aired, make sure the download and watched status are zeroed. #491
                // unless leaked
                data.downloaded = 0;
                data.watched = 0;
                data.watchedAt = null;
            };
            data.absolute = (serie.isAnime()) ? data.number_abs : null;

            for (var i in data) {
                if ((i in episode)) {
                    episode[i] = data[i];
                }
            }
            episode.filename = FanartService.getEpisodePoster(fanart);
            episode.seasonnumber = season.seasonnumber;
            // if there's an entry for the episode in watchedEpisodes, this is a backup restore
            watched.map(function(el) {
                if (el.TVDB_ID == episode.TVDB_ID) {
                    episode.downloaded = 1; // an entry means it has to have been downloaded
                    episode.watchedAt = el.watchedAt; // an entry may mean it's watched ... or not.
                    if (el.watchedAt != null) {
                        episode.watched = 1;
                    } else {
                        episode.watched = 0;
                    };
                }
            });
            episode.ID_Serie = serie.getID();
            episode.ID_Season = season.getID();
            return episode;
        };

        /**
         * Wipe episodes from the database that were cached locally but are no longer in the latest update.
         * @param object seasons Trakt.TV seasons/episodes input
         * @param object series serie entity
         */
        cleanupEpisodes = function(seasons, serie) {
            var tvdbList = [];
            seasons.map(function(season) {
                season.episodes.map(function(episode) {
                    if (isNaN(parseInt(episode.tvdb_id))) return;
                    tvdbList.push(episode.tvdb_id);
                });
            });

            return CRUD.executeQuery('delete from Episodes where ID_Serie = ? and TVDB_ID NOT IN (' + tvdbList.join(',') + ')', [serie.ID_Serie]).then(function(result) {
                if (result.rowsAffected > 0) {
                    console.info("Cleaned up " + result.rowsAffected + " orphaned episodes for series [" + serie.ID_Serie + "] " + serie.name);
                };
                return seasons;
            });
        };

        /**
         * Insert all seasons into the database and return a cached array map
         * @param  CRUD.Entity serie serie to update seasons for
         * @param  object seasons extended seasons input data from Trakt
         * @return object seasonCache indexed by seasonnumber
         */
        updateSeasons = function(serie, seasons, fanart) {
            //console.debug("Update seasons!", seasons, fanart);
            return serie.getSeasonsByNumber().then(function(seasonCache) { // fetch the seasons and cache them by number.
                return Promise.all(seasons.map(function(season) {
                    var SE = (season.number in seasonCache) ? seasonCache[season.number] : new Season();
                    SE.poster = FanartService.getSeasonPoster(season.number, fanart);
                    SE.seasonnumber = season.number;
                    SE.ID_Serie = serie.getID();
                    SE.overview = season.overview;
                    SE.TRAKT_ID = season.trakt_id;
                    if (service.downloadRatings && (!SE.ratingcount || SE.ratingcount + 25 > season.votes)) {
                        SE.ratings = Math.round(season.rating * 10);
                        SE.ratingcount = season.votes;
                    }
                    seasonCache[season.number] = SE;
                    return SE.Persist().then(function() {
                        return true;
                    });
                })).then(function() {
                    return seasonCache;
                });
            });
        };

        updateEpisodes = function(serie, seasons, watched, seasonCache, fanart) {
            //console.debug(" Update episodes!", serie, seasons, watched, seasonCache, fanart);
            return serie.getEpisodesMap().then(function(episodeCache) {
                return Promise.all(seasons.map(function(season) {
                    return Promise.all(season.episodes.map(function(episode) {
                        if (episode.tvdb_id == null) return;
                        var dbEpisode = (!(episode.tvdb_id in episodeCache)) ? new Episode() : episodeCache[episode.tvdb_id];
                        return fillEpisode(dbEpisode, episode, seasonCache[season.number], serie, watched, fanart).Persist().then(function() {
                            episodeCache[episode.tvdb_id] = dbEpisode;
                            return true;
                        });
                    }));
                })).then(function() {
                    return episodeCache;
                });
            });
        };

        var service = {
            initialized: false,
            addingList: {}, // holds any TVDB_ID's that are adding, used for spinner/checkmark icon control
            errorList: {}, // holds any TVDB_ID's that had an error, used for sadface icon control
            favorites: [],
            favoriteIDs: [],
            downloadRatings: $injector.get('SettingsService').get('download.ratings'), // determines if Ratings are processed or discarded

            /**
             * Handles adding, deleting and updating a show to the local database.
             * Grabs the existing serie, seasons and episode from the database if they exist
             * and inserts or updates the information.
             * Deletes the episode from the database if TraktTV no longer has it.
             * Returns a promise that gets resolved when all the updates have been launched
             * (but not necessarily finished, they'll continue to run)
             *
             * @param object data input data from TraktTV.findSerieByTVDBID(data.TVDB_ID)
             * @param object watched { TVDB_ID => watched episodes } mapped object to auto-mark as watched
             */
            addFavorite: function(data, watched, useTrakt_id, refreshFanart) {
                watched = watched || [];
                useTrakt_id = useTrakt_id || false;
                refreshFanart = refreshFanart || false;
                //console.debug("FavoritesService.addFavorite!", data, watched, useTrakt_id, refreshFanart);

                var entity = null;
                if (data.title === null || data.tvdb_id === null) { // if odd invalid data comes back from trakt.tv, remove the whole serie from db.
                    console.error("received error data as input, removing from favorites.");
                    return service.remove({
                        name: data.title,
                        TVDB_ID: data.tvdb_id
                    });
                };
                var serie = (useTrakt_id) ? service.getByTRAKT_ID(data.trakt_id) : service.getById(data.tvdb_id) || new Serie();
                return FanartService.get(data.tvdb_id, refreshFanart).then(function(fanart) {
                    fanart = (fanart && 'json' in fanart) ? fanart.json : {};
                    fillSerie(serie, data, fanart);
                    return serie.Persist().then(function() {
                            return serie;
                        }).then(function(serie) {
                            addToFavoritesList(serie); // cache serie in favoritesservice.favorites
                            $rootScope.$applyAsync();
                            entity = serie;
                            return cleanupEpisodes(data.seasons, entity);
                        })
                        .then(function() {
                            return updateSeasons(entity, data.seasons, fanart);
                        })
                        .then(function(seasonCache) {
                            return updateEpisodes(entity, data.seasons, watched, seasonCache, fanart);
                        })
                        .then(function(episodeCache) {
                            $injector.get('CalendarEvents').processEpisodes(entity, episodeCache);
                            //console.debug("FavoritesService.Favorites", service.favorites)
                            $rootScope.$applyAsync();
                            $rootScope.$broadcast('background:load', serie.fanart);
                            $rootScope.$broadcast('storage:update');
                            $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie);
                            return entity;
                        });
                })
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
            waitForInitialization: function() {
                return $q(function(resolve, reject) {
                    function waitForInitialize() {
                        if (service.initialized) {
                            resolve();
                        } else {
                            setTimeout(waitForInitialize, 50);
                        }
                    }
                    waitForInitialize();
                });
            },
            getEpisodesForDateRange: function(start, end) {
                return service.waitForInitialization().then(function() {
                    var filter = ['Episodes.firstaired > "' + start + '" AND Episodes.firstaired < "' + end + '" '];
                    return CRUD.Find('Episode', filter).then(function(ret) {
                        return ret;
                    });
                });
            },
            /**
             * Find a serie by it's TVDB_ID (the main identifier for series since they're consistent regardless of local config)
             */
            getById: function(id) {
                return service.favorites.filter(function(el) {
                    return el.TVDB_ID == id;
                })[0];
            },
            getByTRAKT_ID: function(id) {
                return service.favorites.filter(function(el) {
                    return el.TRAKT_ID == id;
                })[0];
            },
            getByID_Serie: function(id) {
                return service.favorites.filter(function(el) {
                    return el.ID_Serie == id;
                })[0];
            },
            hasFavorite: function(id) {
                return service.favoriteIDs.indexOf(id.toString()) > -1;
            },
            /**
             * Remove a serie, it's seasons, and it's episodes from the database.
             */
            remove: function(serie) {
                serie.displaycalendar = 0;
                console.debug("Remove serie from favorites!", serie);
                var seriesToBeDeleted = service.getById(serie.TVDB_ID);
                CRUD.executeQuery('delete from Seasons where ID_Serie = ' + serie.ID_Serie);
                CRUD.executeQuery('delete from Episodes where ID_Serie = ' + serie.ID_Serie);
                service.favoriteIDs = service.favoriteIDs.filter(function(id) {
                    return id != serie.TVDB_ID;
                });
                if ('Delete' in serie) {
                    serie.Delete().then(function() {
                        service.favorites = service.favorites.filter(function(el) {
                            return el.getID() != serie.getID();
                        });
                        console.info("Serie '" + serie.name + "' deleted. Syncing storage.");
                        $rootScope.$broadcast('storage:update');
                        if (service.favorites.length === 0) {
                            $rootScope.$broadcast('serieslist:empty');
                        }
                    });
                };
                service.clearAdding(serie.TVDB_ID);
            },
            refresh: function() {
                return service.getSeries().then(function(results) {
                    service.favorites = results;
                    var ids = [];
                    results.map(function(el) {
                        ids.push(el.TVDB_ID.toString());
                    });
                    service.favoriteIDs = ids;
                    if (ids.length === 0) {
                        setTimeout(function() {
                            $rootScope.$broadcast('serieslist:empty');
                        }, 0);
                    }
                    return service.favorites;
                });
            },
            /**
             * Fetch all the series asynchronously and return them as POJO's
             * (Plain Old Javascript Objects)
             * Runs automatically when this factory is instantiated
             */
            getSeries: function() {
                return CRUD.Find('Serie', ['name is not NULL']).then(function(results) {
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
                CRUD.executeQuery("select fanart from Series where fanart != ''").then(function(result) {
                    if (result.rows.length > 0) {
                        $rootScope.$broadcast('background:load', result.rows[Math.floor(Math.random() * (result.rows.length - 1))].fanart);
                    }
                });
            },
            /**
             * set true the adding status for this series. used to indicate spinner icon required
             */
            adding: function(tvdb_id) {
                if (!(tvdb_id in service.addingList)) {
                    service.addingList[tvdb_id] = true;
                    service.clearError(tvdb_id);
                }
            },
            /**
             * set false the adding status for this series. used to indicate checkmark icon required
             */
            added: function(tvdb_id) {
                if (tvdb_id in service.addingList) service.addingList[tvdb_id] = false;
            },
            /**
             * flush the adding and error status list
             */
            flushAdding: function() {
                service.addingList = {};
                service.errorList = {};
            },
            /**
             * Returns true as long as the add a show to favorites promise is running.
             */
            isAdding: function(tvdb_id) {
                if (tvdb_id === null) return false;
                return ((tvdb_id in service.addingList) && (service.addingList[tvdb_id] === true));
            },
            /**
             * Used to show checkmarks in the add modes for series that you already have.
             */
            isAdded: function(tvdb_id) {
                if (tvdb_id === null) return false;
                return service.hasFavorite(tvdb_id.toString());
            },
            /**
             * clear the adding status for this series. used to indicate spinner and checkmark are NOT required.
             */
            clearAdding: function(tvdb_id) {
                if ((tvdb_id in service.addingList)) delete service.addingList[tvdb_id];
            },
            /**
             * add the error status for this series. used to indicate sadface icon is required.
             */
            addError: function(tvdb_id, error) {
                service.errorList[tvdb_id] = error;
            },
            /**
             * Used to show sadface icon in the add modes for series that you already have.
             */
            isError: function(tvdb_id) {
                if (tvdb_id === null) return false;
                return ((tvdb_id in service.errorList));
            },
            /**
             * clear the error status for this series. used to indicate sadface icon is NOT required.
             */
            clearError: function(tvdb_id) {
                if ((tvdb_id in service.errorList)) delete service.errorList[tvdb_id];
            }
        };

        return service;
    }
])

.run(["FavoritesService", "$state", "$rootScope", function(FavoritesService, $state, $rootScope) {

    //console.log("Executing favoritesservice.run block");
    $rootScope.$on('serieslist:empty', function() {
        //console.log("Series list is empty!, going to add screen.");
        setTimeout(function() {
            $state.go('add_favorites');
        }, 500);
    });

    //console.log("Executing favoritesservice.refresh.");

    FavoritesService.refresh().then(function(favorites) {
        //console.log("Favoritesservice refreshed!");
        FavoritesService.loadRandomBackground();
        FavoritesService.initialized = true;
    });
}]);