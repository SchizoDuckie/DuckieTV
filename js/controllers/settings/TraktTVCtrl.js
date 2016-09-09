/**
 * TraktTV Controller for TraktTV Directive Stuff and the settings tab
 */
DuckieTV.controller('TraktTVCtrl', ["$rootScope", "$injector", "TraktTVv2", "FavoritesService", "SettingsService",
    function($rootScope, $injector, TraktTVv2, FavoritesService, SettingsService) {

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
        vm.pushError = [false, null];
        vm.onlyCollection = false;
        vm.watchedEpisodes = 0;

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

        /* Note: I intentionally used my own cache and not the FavoritesService adding Cache because
         *  if we use FavoritesService cache while importing on the Serieslist it will also cause
         *  all the shows below that are being added to update with the spinners and with a lot of
         *  series the performance impact is noticeable.
         */
        vm.isAdding = function(trakt_id) {
            return addedSeries.indexOf(trakt_id) == -1;
        };

        // Imports users Series and Watched episodes from TraktTV
        var collectionIDCache = [],
            watchedIDCache = [],
            addedSeries = [],
            localSeries = {},
            alreadyImported = false;
        vm.readTraktTV = function() {
            if (alreadyImported) return;
            alreadyImported = true;
            FavoritesService.getSeries().then(function(series) {
                console.info("Mapping currently added series");
                series.map(function(serie) {
                    localSeries[serie.TVDB_ID] = serie;
                });
            }).then(TraktTVv2.userShows().then(function(userShows) {
                console.info("Found", userShows.length, "shows in users collection");
                TraktTVv2.watched().then(function(watchedShows) {
                    console.info("Found", watchedShows.length, "shows in users watched episodes collection");
                    // Go through and determine all the shows we're adding
                    userShows.forEach(function(serie) {
                        vm.traktTVSeries.push(serie);
                        collectionIDCache.push(serie.trakt_id);
                    });
                    watchedShows.forEach(function(show) {
                        if (collectionIDCache.indexOf(show.trakt_id) !== -1) {
                            watchedIDCache.push(show.trakt_id);
                            return;
                        }
                        if (vm.onlyCollection) return; // If we're only adding shows in collection not any show ever watched
                        vm.traktTVSeries.push(show);
                        watchedIDCache.push(show.trakt_id);
                        collectionIDCache.push(show.trakt_id);
                    });

                    Promise.all(userShows.map(function(serie) {
                        if (serie.trakt_id in localSeries) { // Don't re-add serie if it's already added
                            if (watchedIDCache.indexOf(serie.trakt_id) == -1) { // If no watched episodes mark it as added
                                addedSeries.push(serie.trakt_id);
                            }
                            return Promise.resolve();
                        }

                        return TraktTVv2.serie(serie.slug_id).then(function(data) {
                            return FavoritesService.addFavorite(data).then(function(s) {
                                localSeries[serie.trakt_id] = s;
                                if (watchedIDCache.indexOf(serie.trakt_id) == -1) {
                                    addedSeries.push(serie.trakt_id); // If no watched episodes mark it as added
                                }
                            });
                        }).catch(function() {}); // Ignore errors, resolve anyway
                    })).then(function() {
                        Promise.all(watchedShows.map(function(show) {
                            // Don't fetch show if it's not in collection and we're in collectionOnly
                            if (vm.onlyCollection && collectionIDCache.indexOf(show.trakt_id) == -1) {
                                return Promise.resolve();
                            }
                            if (show.trakt_id in localSeries) { // Don't re-add serie if it's already added
                                return Promise.resolve(show);
                            }

                            return TraktTVv2.serie(show.slug_id).then(function(data) {
                                return FavoritesService.addFavorite(data).then(function(s) {
                                    localSeries[show.trakt_id] = s;
                                    return show;
                                });
                            }).catch(function() {}); // Ignore errors, resolve anyway
                        })).then(function(watchedShows) {
                            var shows = watchedShows.filter(Boolean);
                            console.info("Done adding watched shows, adding watched episodes to DB");
                            Promise.all(shows.map(function(show) {
                                var watchedEpisodesReport = [];
                                return Promise.all(show.seasons.map(function(season) {
                                    return Promise.all(season.episodes.map(function(episode) {
                                        return CRUD.FindOne('Episode', {
                                            seasonnumber: season.number,
                                            episodenumber: episode.number,
                                            'Serie': {
                                                TRAKT_ID: show.trakt_id
                                            }
                                        }).then(function(epi) {
                                            if (!epi) {
                                                console.warn("Episode s%se%s not found for %s", season.number, episode.number, show.name);
                                            } else {
                                                vm.watchedEpisodes++;
                                                watchedEpisodesReport.push(epi.getFormattedEpisode());
                                                return epi.markWatched(vm.downloadedPaired);
                                            }
                                        }).catch(function() {});
                                    }));
                                })).then(function() {
                                    addedSeries.push(show.trakt_id);
                                    //console.info("Episodes marked as watched for ", show.name, watchedEpisodesReport);
                                });
                            })).then(function() {
                                console.info("Successfully marked all episodes as watched");
                                setTimeout(function() {
                                    console.info("Firing series:recount:watched")
                                    $rootScope.$broadcast('series:recount:watched');
                                }, 7000);
                            })
                        });
                    });
                });
            }));
        };

        // Push current series and watched episodes to TraktTV
        vm.pushToTraktTV = function() {

            FavoritesService.favorites.map(function(serie) {
                console.info("Adding series %s to Trakt.TV user's collection.", serie.name);
                TraktTVv2.addToCollection(serie.TVDB_ID);
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
