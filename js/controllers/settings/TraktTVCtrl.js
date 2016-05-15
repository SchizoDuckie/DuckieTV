/**
 * TraktTV Controller for TraktTV Directive Stuff and the settings tab
 */
DuckieTV.controller('TraktTVCtrl', ["$rootScope", "$scope", "$injector", "TraktTVv2", "FavoritesService", "SettingsService",
    function($rootScope, $scope, $injector, TraktTVv2, FavoritesService, SettingsService) {

        // Array for credentials
        $scope.credentials = {
            username: '',
            pincode: '',
            success: localStorage.getItem('trakttv.token') || false,
            error: false,
            authorizing: false,
            getpin: false
        };

        $scope.tuPeriod = SettingsService.get('trakt-update.period');
        $scope.traktSync = SettingsService.get('trakttv.sync');
        $scope.traktTVSeries = [];
        $scope.localSeries = {};
        $scope.pushError = [false, null];
        $scope.watchedEpisodesReport = [];

        $scope.onAuthorizeEnter = function() {
            if ($scope.credentials.username !== '') {
                window.open($scope.getPinUrl(), '_blank');
                $scope.credentials.getpin = true;
            }
        };

        $scope.onLoginEnter = function() {
            $scope.authorize($scope.credentials.pincode);
        };

        $scope.getPin = function() {
            if ($scope.credentials.username !== '') {
                $scope.credentials.getpin = true;
            }
        };

        // Clears all local credentials and token in local storage
        $scope.clearCredentials = function() {
            $scope.credentials.username = '';
            $scope.credentials.pincode = '';
            $scope.credentials.success = false;
            $scope.credentials.error = false;
            $scope.credentials.authorizing = false;
            $scope.credentials.getpin = false;
            localStorage.removeItem('trakttv.token');
            localStorage.removeItem('trakttv.refresh_token');
        };

        // renew credentials 
        $scope.renewCredentials = function() {
            return TraktTVv2.renewToken().then(function(result) {
                $scope.credentials.success = result;
            });
        };

        // Validates username and password with TraktTV
        $scope.authorize = function(pin) {
            $scope.credentials.authorizing = true;
            return TraktTVv2.login(pin).then(function(result) {
                $scope.credentials.success = result;
                $scope.credentials.error = false;
                $scope.credentials.authorizing = false;
            }, function(error) {
                $scope.clearCredentials();
                if (error.data.error && error.data.error_description) {
                    $scope.credentials.error = error.status + ' - ' + error.data.error + ' - ' + error.data.error_description;
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
            //console.debug("Counting watched episodes for ", show, count);
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
            // Fetch all Trakt.TV user's watched shows
            .then(TraktTVv2.watched).then(function(shows) {
                //console.info("Found watched from Trakt.TV", shows);
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
                        $scope.watchedEpisodesReport = [];
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
                                        console.warn("Episode s%se%s not found for %s", season.number, episode.number, show.name);
                                    } else {
                                        $scope.watchedEpisodesReport.push(epi.getFormattedEpisode());
                                        return epi.markWatched();
                                    }
                                });
                            }));
                        })).then(function() {
                            FavoritesService.added(show.tvdb_id);
                            console.info("Episodes marked as watched for ", show.name, $scope.watchedEpisodesReport);
                        });
                    }));

                });
            })
            // process Trakt.TV user's collected shows
            .then(TraktTVv2.userShows().then(function(data) {
                //console.info("Found user shows from Trakt.TV", data);
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
            })).then(function() {
                setTimeout(function() {
                    $rootScope.$broadcast('series:recount:watched');
                }, 6000);
            });
        };

        // Push current series and watched episodes to TraktTV
        $scope.pushToTraktTV = function() {
            var serieIDs = {};

            FavoritesService.favorites.map(function(serie) {
                console.info("Adding series %s to Trakt.TV user's collection.",serie.name);
                TraktTVv2.addToCollection(serie.TVDB_ID);
                serieIDs[serie.ID_Serie] = serie.TVDB_ID;
            });

            CRUD.Find('Episode', {
                'watched': '1'
            }, {
                limit: '100000'
            }).then(function(episodes) {
                TraktTVv2.markEpisodesWatched(episodes);
                console.info("Marking Trakt.TV user's episodes as watched.", episodes);
            });
        };

        $scope.toggleTraktSync = function() {
            $scope.traktSync = !$scope.traktSync;
            SettingsService.set('trakttv.sync', $scope.traktSync);
        };
        /**
         * Changes the hourly period DuckieTV fetches Trakt.TV episodes updates with.
         */
        $scope.saveTUPeriod = function(period) {
            SettingsService.set('trakt-update.period', period);
            $injector.get('DuckietvReload').windowLocationReload();
        };
    }
]);