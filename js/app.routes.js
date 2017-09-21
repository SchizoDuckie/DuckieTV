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
            if (!SidePanelState.state.isShowing) {
                SidePanelState.show();
            }
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

        function hideSidePanel(SidePanelState) {
            SidePanelState.hide();
            return SidePanelState;
        }


        function findEpisodes($stateParams) {
            return Episode.findByID_Season($stateParams.season_id);
        }

        function findEpisode($stateParams) {
            return Episode.findByID($stateParams.episode_id);
        }

        function findSeasonByID($stateParams) {
            return Season.findByID($stateParams.season_id);
        }

        function findSerieByID($stateParams) {
            return Serie.findByID($stateParams.id);
        }

        function hideAddingList(SeriesAddingState) {
            SeriesAddingState.hide();
            return SeriesAddingState;
        }

        function hideSeriesList(SeriesListState) {
            SeriesListState.hide();
            return SeriesListState;
        }

        function showSeriesList(SeriesListState) {
            SeriesListState.show();
            return SeriesListState
        }

        function showAddingList(SeriesAddingState) {
            SeriesAddingState.show();
            return SeriesAddingState;
        }


        // if the path doesn't match any of the urls you configured
        // otherwise will take care of routing the user to the specified url

        $stateProvider
            .state('calendar', {
                url: '/',
                resolve: {
                    SidePanelState: hideSidePanel,
                    SeriesAddingState: hideAddingList,
                    SeriesListState: hideSeriesList
                }
            })

        .state('favorites', {
            url: '/favorites',
            sticky: true,
            resolve: {
                SidePanelState: hideSidePanel,
                SeriesListState: showSeriesList,
                SeriesAddingState: hideAddingList,
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
                    templateUrl: 'templates/serieslist/tools/favorites.html',
                    controller: 'localSeriesCtrl',
                    controllerAs: 'localFilter',
                    bindToController: true
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

        .state('add_favorites', {
            url: '/add',
            sticky: true,
            resolve: {
                SidePanelState: hideSidePanel,
                SeriesListState: hideSeriesList,
                SeriesAddingState: showAddingList
            },
            views: {
                favorites: {
                    templateUrl: 'templates/seriesList.html',
                    controller: 'seriesListCtrl',
                    controllerAs: 'serieslist',
                    bindToController: true
                },
                'tools@add_favorites': {
                    templateUrl: 'templates/serieslist/tools/adding.html',
                    controller: ["$state", "$stateParams", function($state, $stateParams) {
                        this.query = $stateParams.query;
                        this.search = function(q) {
                            if (q.length > 0) {
                                $state.go('add_favorites.search', {
                                    query: q
                                });
                            } else {
                                $state.go('add_favorites');
                            }
                        };
                    }],
                    controllerAs: 'search',
                    bindToController: true
                },
                'content@add_favorites': {
                    templateUrl: 'templates/serieslist/trakt-trending.html',
                    controller: 'traktTvTrendingCtrl',
                    controllerAs: 'trending'
                }
            }
        })

        .state('add_favorites.search', {
            url: '/search/:query',
            views: {
                'content@add_favorites': {
                    templateUrl: 'templates/serieslist/trakt-searching.html',
                    controller: 'traktTvSearchCtrl',
                    controllerAs: 'traktSearch'
                }
            }

        })

        .state('add_favorites.search.trakt-serie', {
            url: '/:id',
            params: {
                serie: {}
            },
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($stateParams) {
                    return $stateParams.serie;
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

        .state('add_favorites.trakt-serie', {
            url: '/info/:id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($state, $stateParams, TraktTVTrending) {
                    return TraktTVTrending.getByTraktId($stateParams.id);
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
                }
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/watchlist.html'
                }
            }
        })

        // note: separate state from serie.season.episode navigation because we want to only open the sidepanel from the calendar, not expand it
        .state('episode', {
            url: '/episode/:episode_id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($stateParams) {
                    return Serie.findOneByEpisode({
                        ID_Episode: $stateParams.episode_id
                    });
                },
                season: function($stateParams) {
                    return Serie.findOneByEpisode({
                        ID_Episode: $stateParams.episode_id
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
                    return Serie.findByID($stateParams.id).then(function(result) {
                        return result.getActiveSeason();
                    });
                },
                notWatchedSeason: function($stateParams) {
                    return Serie.findByID($stateParams.id).then(function(result) {
                        return result.getNotWatchedSeason();
                    });
                }

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
                    return Season.findBySerie({
                        ID_Serie: $stateParams.id
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
                episodes: findEpisodes,
                seasons: function($stateParams) {
                    return Season.findBySerie({
                        ID_Serie: $stateParams.id
                    });
                }
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
            resolve: {
                SidePanelState: showSidePanel,
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/settings.html',
                    controller: 'SettingsCtrl',
                }
            }
        })

        .state('settings.tab', {
            url: '/:tab',
            resolve: {
                SidePanelState: expandSidePanel,
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
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/torrentClient.html',
                    controller: 'TorrentCtrl',
                    controllerAs: 'client'
                }
            }
        })

        .state('torrent.details', {
            url: '/:id',
            params: {
                torrent: {}
            },
            resolve: {
                SidePanelState: expandSidePanel,
                torrent: function($stateParams, SidePanelState) {
                    if (!('getName' in $stateParams.torrent)) {
                        setTimeout(SidePanelState.show, 500); // contract sidepanel on page refresh, and not torrent
                    }
                    return $stateParams.torrent;
                }
            },
            views: {
                torrentDetails: {
                    templateUrl: function($stateParams) {
                        return 'templates/torrentClient.details.html';
                    },
                    controller: 'TorrentDetailsCtrl',
                    controllerAs: 'vm'
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
                }
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/about.html',
                    controller: 'AboutCtrl'
                }
            }
        })

        .state('autodlstatus', {
            url: '/autodlstatus',
            resolve: {
                SidePanelState: function(SidePanelState) {
                    setTimeout(function() {
                        expandSidePanel(SidePanelState);
                    }, 0);
                }
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/autodlstatus.html',
                    controller: 'AutodlstatusCtrl'
                }
            }
        })

        .state('videoplayer', {
            url: '/videoplayer',
            resolve: {
                SidePanelState: function(SidePanelState) {
                    setTimeout(function() {
                        expandSidePanel(SidePanelState);
                    }, 0);
                }
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/synology.html',
                    controller: 'SynologyDSVideoCtrl',
                    controllerAs: 'syno'
                }
            }
        });


        $urlRouterProvider.otherwise('/');
    }
]);