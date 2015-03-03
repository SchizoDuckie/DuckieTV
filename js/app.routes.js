/**
 * Routing configuration.
 */
DuckieTV.config(["$stateProvider",
    function($stateProvider) {
        var applyTranslation = function($translate, SettingsService) {
            $translate.use(SettingsService.get('application.locale'));
        }

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

        function hideSidePanel(SidePanelState, $rootScope) {
            $rootScope.$broadcast('serieslist:hide');
            $rootScope.$applyAsync();
            SidePanelState.hide();
            return SidePanelState
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
            })
        }

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
                    }
                },
                views: {
                    favorites: {
                        templateUrl: 'templates/seriesList.html',
                    },
                    'tools@favorites': {
                        templateUrl: 'templates/serieslist/tools/favorites.html'
                    },
                    'content@favorites': {
                        templateUrl: 'templates/serieslist/favorites.html',
                        controller: 'localSeriesCtrl',
                        controllerAs: 'local',
                    }
                }
            })
            .state('favorites.add', {
                sticky: true,
                url: '/add',
                views: {
                    'tools@favorites': {
                        templateUrl: 'templates/serieslist/tools/adding.html',
                        controller: function($state, $stateParams) {
                            this.query = $stateParams.query
                            this.search = function(q) {
                                console.log('search!')
                                if (q.length > 0) {
                                    $state.go('favorites.add.search', {
                                        query: q
                                    });
                                } else {
                                    $state.go('favorites.add');
                                }
                            }
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
            .state('favorites.add.empty', {
                url: '/empty',
                views: {
                    'content@favorites': {
                        templateUrl: 'templates/serieslist/empty-import.html',
                        controller: 'traktTvTrendingCtrl',
                        controllerAs: 'trending'
                    }
                }
            })
            .state('favorites.add.search', {
                sticky: true,
                url: '/search/:query',
                views: {
                    'content@favorites': {
                        templateUrl: 'templates/serieslist/trakt-searching.html',
                        controller: 'traktTvSearchCtrl',
                        controllerAs: 'traktSearch'
                    }
                }
            })
            .state('trakt-serie', {
                sticky: true,
                resolve: {
                    SidePanelState: showSidePanel
                },
                views: {
                    sidePanel: {
                        templateUrl: 'templates/sidepanel/trakt-serie-details.html',
                        controller: 'sidepanelTraktSerieCtrl',
                        controllerAs: 'sidepanel'
                    }
                }
            })


        .state('watchlist', {
            url: '/watchlist',
            resolve: {
                SidePanelState: expandSidePanel
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
            sticky: true,
            url: '/episode/:episode_id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        Episode: {
                            ID_Episode: $stateParams.episode_id
                        }
                    })
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
            sticky: true,
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
                        })
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
            sticky: true,
            url: '/settings',
            resolve: {
                SidePanelState: showSidePanel
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
                SidePanelState: expandSidePanel
            },
            views: {
                settingsTab: {
                    templateUrl: function($stateParams) {
                        return 'templates/settings/' + $stateParams.tab + '.html'
                    }
                }
            }
        })

        .state('cast', {
            url: '/cast',
            resolve: {
                SidePanelState: expandSidePanel
            },
            views: {
                sidePanel: {
                    controller: 'ChromeCastCtrl',
                    templateUrl: 'templates/chromecast.html',

                }
            }
        })

        .state('torrent', {
            sticky: true,
            url: '/torrent',
            resolve: {
                SidePanelState: showSidePanel
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
                SidePanelState: expandSidePanel
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/about.html',
                    controller: 'AboutCtrl'
                }
            }
        })
    }
])