/**
 * Routing configuration.
 */
DuckieTV.config(["$stateProvider", "$urlRouterProvider",
    function($stateProvider, $urlRouterProvider) {
        var applyTranslation = function($translate, SettingsService) {
            $translate.use(SettingsService.get('application.locale'));
        };

        function showSidePanel(SidePanelState) {
            SidePanelState.show();
            return SidePanelState;
        }

        function expandSidePanel(SidePanelState) {
            SidePanelState.show();
            SidePanelState.expand();
            return SidePanelState;
        }

        function expandSidePanelIfOpen(SidePanelState) {
            if (SidePanelState.state.isShowing) {
                SidePanelState.expand();
            } else {
                SidePanelState.show();
            }
            return SidePanelState;
        }

        function hideSidePanel(SidePanelState, SeriesListState) {
            SeriesListState.hide();
            SidePanelState.hide();
            return SidePanelState;
        }

        function hideSeriesList(SeriesListState) {
            SeriesListState.hide();
            return SeriesListState;
        }

        function findEpisodes($stateParams) {
            return CRUD.Find('Episode', {
                ID_Season: $stateParams.season_id
            });
        }

        function findEpisode($stateParams) {
            return CRUD.FindOne('Episode', {
                ID_Episode: $stateParams.episode_id
            });
        }

        function findSeasonByID($stateParams) {
            return CRUD.FindOne('Season', {
                ID_Season: $stateParams.season_id
            });
        }

        function findSerieByID($stateParams) {
            return CRUD.FindOne('Serie', {
                ID_Serie: $stateParams.id
            });
        }

        // if the path doesn't match any of the urls you configured
        // otherwise will take care of routing the user to the specified url

        $stateProvider

        .state('calendar', {
            url: '/',
            resolve: {
                SidePanelState: hideSidePanel
            }
        })

        .state('favorites', {
            sticky: true,
            url: '/favorites',
            resolve: {
                SeriesListState: function(SeriesListState) {
                    SeriesListState.show();
                    return SeriesListState;
                },
                SidePanelState: function(SidePanelState) {
                    SidePanelState.hide();
                    return SidePanelState;
                },
                FavoritesService: function(FavoritesService) {
                    return FavoritesService.waitForInitialization().then(function() {
                        return FavoritesService;
                    });
                },
            },
            views: {
                favorites: {
                    templateUrl: 'templates/seriesList.html',
                    controller: 'seriesListCtrl',
                    controllerAs: 'serieslist',
                    bindToController: true
                },
                'tools@favorites': {
                    templateUrl: 'templates/serieslist/tools/favorites.html'
                },
                'content@favorites': {
                    templateUrl: 'templates/serieslist/favorites.html',
                    controller: 'localSeriesCtrl',
                    controllerAs: 'local',
                    bindToController: true
                }
            }
        })

        .state('favorites.search', {
            url: '/search',

            views: {
                'tools@favorites': {
                    templateUrl: 'templates/serieslist/tools/localfilter.html',
                    controller: 'localSeriesCtrl',
                    controllerAs: 'localFilter',
                    bindToController: true
                },
                'content@favorites': {
                    templateUrl: 'templates/serieslist/searchresults.html'
                }
            }
        })

        .state('favorites.add', {
            url: '/add',
            views: {
                'tools@favorites': {
                    templateUrl: 'templates/serieslist/tools/adding.html',
                    controller: function($state, $stateParams) {
                        this.query = $stateParams.query;
                        this.search = function(q) {
                            if (q.length > 0) {
                                $state.go('favorites.add.search', {
                                    query: q
                                });
                            } else {
                                $state.go('favorites.add');
                            }
                        };
                    },
                    controllerAs: 'search',
                    bindToController: true
                },
                'content@favorites': {
                    templateUrl: 'templates/serieslist/trakt-trending.html',
                    controller: 'traktTvTrendingCtrl',
                    controllerAs: 'trending'
                }
            }
        })

        .state('favorites.add.search', {
            url: '/search/:query',
            resolve: {
                SidePanelState: showSidePanel
            },
            views: {
                'content@favorites': {
                    templateUrl: 'templates/serieslist/trakt-searching.html',
                    controller: 'traktTvSearchCtrl',
                    controllerAs: 'traktSearch'
                }
            }
        })

        .state('favorites.add.trakt-serie', {
            url: '/info/:id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($state, $stateParams, TraktTVTrending) {
                    return TraktTVTrending.getById($stateParams.id);
                }
            },
            views: {
                'sidePanel@': {
                    templateUrl: 'templates/sidepanel/trakt-serie-details.html',
                    controller: 'sidepanelTraktSerieCtrl',
                    controllerAs: 'sidepanel'
                }
            }
        })


        .state('watchlist', {
            url: '/watchlist',
            resolve: {
                SidePanelState: function(SidePanelState) {
                    setTimeout(function() {
                        expandSidePanel(SidePanelState);
                    }, 0);
                },
                SeriesListState: hideSeriesList
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/watchlist.html',
                    controller: 'WatchlistCtrl'
                }
            }
        })

        // note: separate state from serie.season.episode navigation because we want to only open the sidepanel from the calendar, not expand it
        .state('episode', {
            url: '/episode/:episode_id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        Episode: {
                            ID_Episode: $stateParams.episode_id
                        }
                    });
                },
                season: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        Episode: {
                            ID_Episode: $stateParams.episode_id
                        }
                    }).then(function(result) {
                        return result.getActiveSeason();
                    });
                },
                episode: findEpisode
            },

            views: {
                'sidePanel': {
                    controller: 'SidepanelEpisodeCtrl',
                    controllerAs: 'sidepanel',
                    templateUrl: 'templates/sidepanel/episode-details.html'
                }
            }
        })

        .state('serie', {
            url: '/series/:id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: findSerieByID,
                latestSeason: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        ID_Serie: $stateParams.id
                    }).then(function(result) {
                        return result.getActiveSeason();
                    });
                },

            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/serie-overview.html',
                    controller: 'SidepanelSerieCtrl',
                    controllerAs: 'sidepanel'
                }
            }
        })

        .state('serie.details', {
            url: '/details',
            resolve: {
                SidePanelState: expandSidePanel,
            },
            views: {
                serieDetails: {
                    templateUrl: 'templates/sidepanel/serie-details.html'
                }
            }
        })

        .state('serie.seasons', {
            url: '/seasons',
            resolve: {
                SidePanelState: expandSidePanel,
                seasons: function($stateParams) {
                    return CRUD.Find('Season', {
                        Serie: {
                            ID_Serie: $stateParams.id
                        }
                    });
                }
            },
            views: {
                serieDetails: {
                    controller: 'SidepanelSeasonsCtrl',
                    controllerAs: 'seasons',
                    templateUrl: 'templates/sidepanel/seasons.html'
                }
            }
        })

        // note: this is a sub state of the serie state. the serie is already resolved here and doesn't need to be redeclared!
        .state('serie.season', {
            url: '/season/:season_id',
            resolve: {
                SidePanelState: expandSidePanel,
                season: findSeasonByID,
                episodes: findEpisodes
            },
            views: {
                serieDetails: {
                    templateUrl: 'templates/sidepanel/episodes.html',
                    controller: 'SidepanelSeasonCtrl',
                    controllerAs: 'season',
                }
            }
        })

        // note: this is a sub state of the serie state. the serie is already resolved here and doesn't need to be redeclared!
        .state('serie.season.episode', {
            url: '/episode/:episode_id',
            resolve: {
                SidePanelState: expandSidePanelIfOpen,
                episode: findEpisode
            },
            views: {
                'sidePanel@': {
                    controller: 'SidepanelEpisodeCtrl',
                    controllerAs: 'sidepanel',
                    templateUrl: 'templates/sidepanel/episode-details.html'
                },
                'serieDetails@serie.season.episode': {
                    templateUrl: 'templates/sidepanel/episodes.html',
                    controller: 'SidepanelSeasonCtrl',
                    controllerAs: 'season',
                }
            }
        })

        .state('settings', {
            url: '/settings',
            sticky: false,
            resolve: {
                SidePanelState: showSidePanel,
                SeriesListState: hideSeriesList
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/settings.html',
                }
            }
        })

        .state('settings.tab', {
            url: '/:tab',
            resolve: {
                SidePanelState: expandSidePanel,
                SeriesListState: hideSeriesList
            },
            views: {
                settingsTab: {
                    templateUrl: function($stateParams) {
                        return 'templates/settings/' + $stateParams.tab + '.html';
                    }
                }
            }
        })

        .state('torrent', {
            url: '/torrent',
            resolve: {
                SidePanelState: showSidePanel,
                SeriesListState: hideSeriesList
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/torrentClient.html',
                    controller: 'TorrentCtrl',
                    controllerAs: 'torrent'
                }
            }
        })

        .state('about', {
            url: '/about',
            resolve: {
                SidePanelState: function(SidePanelState) {
                    setTimeout(function() {
                        expandSidePanel(SidePanelState);
                    }, 0);
                },
                SeriesListState: hideSeriesList
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/about.html',
                    controller: 'AboutCtrl'
                }
            }
        });


        $urlRouterProvider.otherwise('/');

    }
]);