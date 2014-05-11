angular.module('DuckieTV.providers.favorites', [])
/**
 * Persistent storage for favorites
 *
 * Since it fetches asynchronously from sqlite it broadcasts a favorites:updated event
 * when data is done loading
 */
.factory('FavoritesService', function($rootScope, TraktTV, EventSchedulerService, $q) {

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
                serie.set('rating', data.ratings.loved);
            } else if (i == 'genres') {
                serie.set('genre', data.genres.join('|'));
            } else if (i == 'ended') {
                serie.set('status', data[i] == true ? 'Continuing' : 'Ended')
            } else if (i in mappings) {
                serie.set(mappings[i], data[i])
            } else {
                serie.set(i, data[i]);
            }
        }
    }
    fillEpisode = function(episode, d) {

        d.TVDB_ID = d.tvdb_id;
        d.rating = d.ratings.percentage
        d.episodenumber = d.episode;
        d.episodename = d.title;
        d.firstaired = d.first_aired_utc == 0 ? null : new Date(d.first_aired_iso).getTime();
        d.filename = d.screen;
        episode.changedValues = d;
    }
    var service = {
        favorites: [],
        TraktTV: TraktTV,
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
                    $rootScope.$broadcast('favorites:updated');

                    service.updateEpisodes(serie, data.seasons, watched).then(function(result) {
                        d.resolve(result);
                    }, function(err) {
                        d.reject(err);
                    });
                });
            });
            return d.promise;
        },
        updateEpisodes: function(serie, seasons, watched) {
            watched = watched || [];

            var cache = {};
            var seasonCache = {};
            var p = $q.defer();
            serie.getSeasons().then(function(sea) {
                sea.map(function(el) {
                    seasonCache[el.get('seasonnumber')] = el;
                })

            }).then(function() {
                serie.getEpisodes().then(function(data) {

                    data.map(function(episode) {
                        cache[episode.get('TVDB_ID')] = episode;
                    });
                    var pq = [];

                    for (var j = 0; j < seasons.length; j++) {
                        var episodes = seasons[j].episodes;
                        var season = seasons[j];
                        var SE = (season.season in seasonCache) ? seasonCache[season.season] : new Season();
                        for (var s in season) {
                            SE.set(s, season[s]);
                        }
                        SE.set('seasonnumber', season.season);
                        SE.set('ID_Serie', serie.getID());
                        pq.push((function(episodes, season, S) {
                            return S.Persist().then(function(r) {
                                episodes.map(function(episode) {
                                    var e = (!(episode.tvdb_id in cache)) ? new Episode() : cache[episode.tvdb_id];
                                    fillEpisode(e, episode);
                                    var watchedEpisodes = watched.filter(function(el) {
                                        return el.TVDB_ID == e.get('TVDB_ID');
                                    });

                                    e.set('seasonnumber', season.season);

                                    e.set('ID_Serie', serie.getID());
                                    e.set('ID_Season', S.getID());
                                    if (watchedEpisodes.length > 0) {
                                        e.set('watched', 1);
                                        e.set('watchedAt', watchedEpisodes[0].watchedAt);
                                    }
                                    if (e.changedValues.length > 0) {
                                        console.log("Found changed values for ", serie.getName(), e.getFormattedEpisode(), 'updating!', e.changedValues());
                                        e.Persist().then(function(res) {}, function(err) {
                                            console.error("PERSIST ERROR!", err);
                                        });

                                    }
                                    
                                })
                            });
                        })(episodes, season, SE));
                    }
                    $q.all(pq).then(function(result) {
                        p.resolve();
                        $rootScope.$broadcast('episodes:updated');
                    })
                })

            });
            return p.promise;
        },
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
        getById: function(id) {
            return CRUD.FindOne('Serie', {
                'TVDB_ID': id
            });
        },
        remove: function(serie) {
            console.log("Remove serie from favorites!", serie);
            this.getById(serie['TVDB_ID']).then(function(s) {
                s.Find('Season').then(function(seasons) {
                    seasons.map(function(el) {
                        el.Delete();
                    });
                });
                s.Find('Episode').then(function(episodes) {
                    episodes.map(function(el) {
                        el.Delete();
                    });
                    console.log("Found episodes for removal of serie!", episodes);
                    s.Delete().then(function() {
                        $rootScope.$broadcast('storage:update');
                        service.restore()
                    });
                });
            })
            CRUD.FindOne('ScheduledEvent', {
                name: serie.name + ' update check'
            }).then(function(timer) {
                timer.Delete();
                console.log('deleted timer record');
            });
            chrome.alarms.clear(serie.name + ' update check');
        },
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
        loadRandomBackground: function() {
            $rootScope.$broadcast('background:load', service.favorites[Math.floor(Math.random() * service.favorites.length)].fanart);
        },
        /**
         * Fetch stored series from sqlite and store them in service.favorites
         * Notify anyone listening by broadcasting favorites:updated
         */
        restore: function() {
            $rootScope.$on('favoritesservice:checkforupdates', function(evt, data) {
                TraktTV.enableBatchMode().findSerieByTVDBID(data.TVDB_ID).then(function(res) {
                    service.addFavorite(res);
                });

            });
            service.getSeries().then(function(results) {
                service.favorites = results;
                $rootScope.$broadcast('favorites:updated', service);
                $rootScope.$broadcast('episodes:updated');
            });
        }
    };
    service.restore();
    return service;
})