/**
 * TraktTV Controller for TraktTV Directive Stuff and the settings tab
 *
 * TraktTV is special so it gets it's own controller file :)
 */
DuckieTV.controller('TraktTVCtrl', ["$scope", "TraktTVv2", "FavoritesService", "SettingsService",
    function($scope, TraktTVv2, FavoritesService, SettingsService) {

        // Array for credentials
        $scope.credentials = {
            username: localStorage.getItem('trakt.username') || '',
            error: false,
            success: localStorage.getItem('trakt.token') || false,
            authorizing: false
        };

        $scope.traktSync = SettingsService.get('trakttv.sync');
        $scope.traktTVSeries = [];
        $scope.localSeries = {};
        $scope.pushError = [false, null];

        $scope.onEnter = function() {
            $scope.authorize($scope.credentials.username, $scope.credentials.password);
        }

        // Clears all local credentials and token in local storage
        $scope.clearCredentials = function() {
            $scope.credentials.error = false;
            $scope.credentials.success = false;
            $scope.credentials.username = '';
            localStorage.removeItem('trakt.token');
        };

        // Validates username and password with TraktTV
        $scope.authorize = function(username, pin) {
            $scope.credentials.authorizing = true
            return TraktTVv2.login(pin).then(function(result) {
                $scope.credentials.success = result;
                $scope.credentials.error = false;
                $scope.credentials.authorizing = false
            }, function(error) {
                $scope.credentials.success = false;
                $scope.credentials.authorizing = false
                $scope.credentials.password = null;
                if (error.data.message) {
                    $scope.credentials.error = error.data.message;
                } else {
                    $scope.credentials.error = error.status + ' - ' + error.statusText;
                }
            });
        };

        $scope.getPinUrl = function() {
            return TraktTVv2.getPinUrl();
        };

        $scope.isDownloaded = function(tvdb_id) {
            return tvdb_id in $scope.localSeries;
        };

        $scope.getDownloaded = function(tvdb_id) {
            return $scope.localSeries[tvdb_id];
        };

        $scope.isAdded = function(tvdb_id) {
            return FavoritesService.isAdded(tvdb_id);
        };

        $scope.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };

        $scope.countWatchedEpisodes = function(show) {
            if (undefined === show) return 0;
            var count = 0;
            show.seasons.map(function(s) {
                count += s.episodes.length;
            });
            //console.log("Counting watched episodes for ", show, count);
            return count;
        };

        // Imports users Series and Watched episodes from TraktTV
        $scope.readTraktTV = function() {
            FavoritesService.flushAdding();
            FavoritesService.getSeries().then(function(series) {
                series.map(function(serie) {
                    $scope.localSeries[serie.TVDB_ID] = serie;
                });
            })
            // Fetch all watched shows
            .then(TraktTVv2.watched).then(function(shows) {
                console.info("Found watched from Trakt.TV", shows);
                Promise.all(shows.map(function(show) {
                    $scope.traktTVSeries.push(show);
                    // Flag it as added if we already cached it
                    if ((show.tvdb_id in $scope.localSeries)) {
                        FavoritesService.added(show.tvdb_id);
                    } else if (!(show.tvdb_id in $scope.localSeries)) {
                        // otherwise add to favorites, show spinner
                        FavoritesService.adding(show.tvdb_id);
                        return TraktTVv2.serie(show.slug_id).then(function(serie) {
                            return FavoritesService.addFavorite(serie).then(function(s) {
                                $scope.localSeries[s.tvdb_id] = s;
                            });
                        }).then(function(serie) {
                            FavoritesService.added(show.tvdb_id);
                            return serie;
                        });
                    }
                })).then(function() {
                    // Process seasons and episodes marked as watched
                    return Promise.all(shows.map(function(show) {
                        FavoritesService.adding(show.tvdb_id);
                        return Promise.all(show.seasons.map(function(season) {
                            return Promise.all(season.episodes.map(function(episode) {
                                return CRUD.FindOne('Episode', {
                                    seasonnumber: season.number,
                                    episodenumber: episode.number,
                                    'Serie': {
                                        TVDB_ID: show.tvdb_id
                                    }
                                }).then(function(epi) {
                                    if (!epi) {
                                        console.log("Episode not found", season.number, 'e', episode.number, ' for ', show.name);
                                    } else {
                                        console.info("Episode marked as watched: ", show.name, epi.getFormattedEpisode());
                                        return epi.markWatched();
                                    }
                                });
                            }));
                        })).then(function() {
                            FavoritesService.added(show.tvdb_id);
                        });
                    }));

                });
            })
            // user shows times out for me still too often to test proerly
            .then(TraktTVv2.userShows().then(function(data) {
                console.log("Found user shows from Trakt.tV", data);
                data.map(function(show) {
                    $scope.traktTVSeries.push(show);

                    if (!(show.tvdb_id in $scope.localSeries)) {
                        FavoritesService.adding(show.tvdb_id);
                        return TraktTVv2.serie(show.slug_id).then(function(serie) {
                            return FavoritesService.addFavorite(serie).then(function(s) {
                                $scope.localSeries[s.tvdb_id] = s;
                            });
                        }).then(function() {
                            FavoritesService.added(show.tvdb_id);
                        });

                    } else {
                        FavoritesService.added(show.tvdb_id);
                    }
                });
            }));

        };

        // Push current series and watched episodes to TraktTV
        // Currently not working
        $scope.pushToTraktTV = function() {
            var serieIDs = {};

            FavoritesService.favorites.map(function(serie) {
                console.log("Adding serie '" + serie.name + "' to Trakt.tv: ", serie);
                TraktTVv2.addToCollection(serie.TVDB_ID);
                serieIDs[serie.ID_Serie] = serie.TVDB_ID;
            });

            CRUD.Find('Episode', {
                'watched': '1'
            }, {
                limit: '100000'
            }).then(function(episodes) {
                episodes.map(function(episode) {
                    //console.log("marking episode watched: ", episode.get('ID_Serie'), episode.get('TVDB_ID'));
                    TraktTVv2.markEpisodeWatched(serieIDs[episode.get('ID_Serie')], episode);
                });
            });
        };

        $scope.toggleTraktSync = function() {
            $scope.traktSync = !$scope.traktSync;
            SettingsService.set('trakttv.sync', $scope.traktSync);
        };
    }
]);