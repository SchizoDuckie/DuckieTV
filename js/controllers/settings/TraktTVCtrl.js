/**
 * TraktTV Controller for TraktTV Directive Stuff and the settings tab
 */
DuckieTV.controller('TraktTVCtrl', ["$rootScope", "$scope", "$injector", "TraktTVv2", "FavoritesService", "SettingsService",
    function($rootScope, $scope, $injector, TraktTVv2, FavoritesService, SettingsService) {

        var vm = this;

        // Array for credentials
        vm.credentials = {
            pincode: '',
            success: localStorage.getItem('trakttv.token') || false,
            error: false,
            authorizing: false,
            getpin: false
        };

        vm.tuPeriod = SettingsService.get('trakt-update.period');
        vm.traktSync = SettingsService.get('trakttv.sync');
        vm.downloadedPaired = SettingsService.get('episode.watched-downloaded.pairing');
        vm.traktTVSeries = [];
        vm.localSeries = {};
        vm.pushError = [false, null];
        vm.watchedEpisodesReport = [];

        vm.onAuthorizeEnter = function() {
            window.open(vm.getPinUrl(), '_blank');
            vm.credentials.getpin = true;
        };

        vm.onLoginEnter = function() {
            vm.authorize(vm.credentials.pincode);
        };

        vm.getPin = function() {
            vm.credentials.getpin = true;
        };

        // Clears all local credentials and token in local storage
        vm.clearCredentials = function() {
            vm.credentials.pincode = '';
            vm.credentials.success = false;
            vm.credentials.error = false;
            vm.credentials.authorizing = false;
            vm.credentials.getpin = false;
            localStorage.removeItem('trakttv.token');
            localStorage.removeItem('trakttv.refresh_token');
        };

        // renew credentials
        vm.renewCredentials = function() {
            return TraktTVv2.renewToken().then(function(result) {
                vm.credentials.success = result;
            }, function(error) {
                if (error.data && error.data.error && error.data.error_description) {
                    vm.credentials.error = "Error! " + error.status + ' - ' + error.data.error + ' - ' + error.data.error_description;
                } else {
                    vm.credentials.error = "Error! " + error.status + ' - ' + error.statusText;
                }
            });
        };

        // Validates pin with TraktTV
        vm.authorize = function(pin) {
            vm.credentials.authorizing = true;
            return TraktTVv2.login(pin).then(function(result) {
                vm.credentials.success = result;
                vm.credentials.error = false;
                vm.credentials.authorizing = false;
            }, function(error) {
                vm.clearCredentials();
                if (error.data && error.data.error && error.data.error_description) {
                    vm.credentials.error = "Error! " + error.status + ' - ' + error.data.error + ' - ' + error.data.error_description;
                } else {
                    vm.credentials.error = "Error! " + error.status + ' - ' + error.statusText;
                }
            });
        };

        vm.getPinUrl = function() {
            return TraktTVv2.getPinUrl();
        };

        vm.isDownloaded = function(tvdb_id) {
            return tvdb_id in vm.localSeries;
        };

        vm.getDownloaded = function(tvdb_id) {
            return vm.localSeries[tvdb_id];
        };

        vm.isAdded = function(tvdb_id) {
            return FavoritesService.isAdded(tvdb_id);
        };

        vm.isAdding = function(tvdb_id) {
            return FavoritesService.isAdding(tvdb_id);
        };

        vm.countWatchedEpisodes = function(show) {
            if (!show) return 0;
            var count = 0;
            show.seasons.map(function(s) {
                count += s.episodes.length;
            });
            //console.debug("Counting watched episodes for ", show, count);
            return count;
        };

        // Imports users Series and Watched episodes from TraktTV
        vm.readTraktTV = function() {
            FavoritesService.flushAdding();
            FavoritesService.getSeries().then(function(series) {
                    series.map(function(serie) {
                        vm.localSeries[serie.TVDB_ID] = serie;
                    });
                })
                // Fetch all Trakt.TV user's watched shows
                .then(TraktTVv2.watched).then(function(shows) {
                    //console.info("Found watched from Trakt.TV", shows);
                    Promise.all(shows.map(function(show) {
                        vm.traktTVSeries.push(show);
                        // Flag it as added if we already cached it
                        if ((show.tvdb_id in vm.localSeries)) {
                            FavoritesService.added(show.tvdb_id);
                        } else if (!(show.tvdb_id in vm.localSeries)) {
                            // otherwise add to favorites, show spinner
                            FavoritesService.adding(show.tvdb_id);
                            return TraktTVv2.serie(show.slug_id).then(function(serie) {
                                return FavoritesService.addFavorite(serie).then(function(s) {
                                    vm.localSeries[s.tvdb_id] = s;
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
                            vm.watchedEpisodesReport = [];
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
                                            vm.watchedEpisodesReport.push(epi.getFormattedEpisode());
                                            return epi.markWatched(vm.downloadedPaired);
                                        }
                                    });
                                }));
                            })).then(function() {
                                FavoritesService.added(show.tvdb_id);
                                console.info("Episodes marked as watched for ", show.name, vm.watchedEpisodesReport);
                            });
                        }));

                    });
                })
                // process Trakt.TV user's collected shows
                .then(TraktTVv2.userShows().then(function(data) {
                    //console.info("Found user shows from Trakt.TV", data);
                    data.map(function(show) {
                        vm.traktTVSeries.push(show);

                        if (!(show.tvdb_id in vm.localSeries)) {
                            FavoritesService.adding(show.tvdb_id);
                            return TraktTVv2.serie(show.slug_id).then(function(serie) {
                                return FavoritesService.addFavorite(serie).then(function(s) {
                                    vm.localSeries[s.tvdb_id] = s;
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
        vm.pushToTraktTV = function() {
            var serieIDs = {};

            FavoritesService.favorites.map(function(serie) {
                console.info("Adding series %s to Trakt.TV user's collection.", serie.name);
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

        vm.toggleTraktSync = function() {
            vm.traktSync = !vm.traktSync;
            SettingsService.set('trakttv.sync', vm.traktSync);
        };
        /**
         * Changes the hourly period DuckieTV fetches Trakt.TV episodes updates with.
         */
        vm.saveTUPeriod = function(period) {
            SettingsService.set('trakt-update.period', period);
            $injector.get('DuckietvReload').windowLocationReload();
        };
    }
]);
