angular.module('DuckieTV.providers.favorites', [])
/**
 * Persistent storage for favorites
 *
 * Since it fetches asynchronously from sqlite it broadcasts a favorites:updated event
 * when data is done loading
 */
.factory('FavoritesService', function($rootScope, TraktTV, $q) {
    var service = {
        favorites: [],
        addFavorite: function(data) {
            console.log("Add favorite!", data);
            var d = $q.defer(),
                serie = new Serie();

            var mappings = {
                'tvdb_id': 'TVDB_ID',
                'tvrage_id': 'TVRage_ID',
                'imdb_id': 'IMDB_ID',
                'certification': 'contentrating',
                'title': 'name',
                'air_day': 'airs_dayofweek',
                'air_time': 'airs_time',
            }
            for (var i in data) {
                if (i == 'first_aired') {
                    serie.set('firstaired', data.first_aired * 1000);
                }
                if (i == 'ratings') {
                    serie.set('rating', data.ratings.loved);
                } else if (i == 'genres') {
                    serie.set('genre', data.genres.join('|'));
                } else if (i in mappings) {
                    serie.set(mappings[i], data[i])
                } else {
                    serie.set(i, data[i]);
                }
            }
            serie.Persist().then(function(e) {
                console.log("Serie persisted!", serie);
                service.favorites.push(serie.asObject());
                $rootScope.$broadcast('favorites:updated', service);
                TraktTV.findEpisodes(serie.get('TVDB_ID')).then(function(res) {
                    console.log("Found episodes!", res);
                    return service.updateEpisodes(serie.get('TVDB_ID'), res);
                });
            }, function(fail) {
                console.log("Error persisting favorite!", data, arguments);
            });
            return d.promise;
        },
        updateEpisodes: function(serieID, seasons) {
            console.log("---> Update episode: ", serieID, seasons);
            CRUD.FindOne(Serie, {
                'TVDB_ID': serieID
            }).then(function(serie) {
                serie.getEpisodes().then(function(data) {
                    var cache = {};
                    for (var i = 0; i < data.length; i++) {
                        cache[data[i].get('TVDB_ID')] = data[i];
                    }
                    console.log('cache! ', cache, episodes);
                    for (var j = 0; j < seasons.length; j++) {
                        var episodes = seasons[j];
                        var season = episodes.season;
                        var SE = new Season();
                        for (var s in season) {
                            SE.set(s, season[s]);
                        }
                        SE.set('ID_Serie', serie.getID());
                        (function(episodes, season, SE) {

                            SE.then(function(r) {
                                for (var k = 0; k < episodes.length; k++) {
                                    if (!(episodes[k].tvdb_id in cache)) {
                                        var d = episodes[k];
                                        d.ID_Season = r.ID;
                                        d.TVDB_ID = d.tvdb_id;
                                        d.ID_Serie = serie.getID();
                                        d.rating = d.ratings.percentage
                                        d.episodenumber = d.episode;
                                        d.seasonnumber = season.seasonnumber;
                                        d.episodename = d.title;
                                        d.firstaired = d.first_aired_utc == 0 ? null : new Date(d.first_aired_iso).getTime();
                                        d.filename = d.screen;
                                        var e = new Episode();
                                        e.changedValues = d;
                                        e.Persist(true).then(function(res) {}, function(err) {
                                            console.error("PERSIST ERROR!", err);
                                            debugger;
                                        })
                                    }

                                }

                            });
                        })(episodes, season, SE.Persist());

                    }
                    $rootScope.$broadcast('episodes:updated', service);
                });
            });

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
            var self = this;
            this.getById(serie['TVDB_ID']).then(function(serie) {
                serie.Find('Episode').then(function(episodes) {
                    console.log("Found episodes for removal of serie!", episodes);
                    for (var i = 0; i < episodes.length; i++) {
                        episodes[i].Delete().then(function() {
                            console.log("Deleted OK!")
                        }, function(err) {
                            debugger;
                        });
                    }
                    episodes = null;
                    serie.Delete().then(function() {
                        $rootScope.$broadcast('storage:update');
                        self.restore()
                    });
                });
            })
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

        /**
         * Fetch stored series from sqlite and store them in service.favorites
         * Notify anyone listening by broadcasting favorites:updated
         */
        restore: function() {
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