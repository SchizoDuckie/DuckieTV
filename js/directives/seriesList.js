angular.module('DuckieTV.directives.serieslist', [])

.directive('seriesList', function(FavoritesService, $rootScope, $filter, TraktTV) {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: "templates/home-series.html",
        link: function($scope, iElement) {

            /**
             * Typeahead add functions
             */
            $scope.search = {
                query: undefined,
                results: null
            }


            $scope.activated = false;
            $scope.activeId = null;
            $scope.searchingForSerie = false;
            $scope.serieAddFocus = false;

            $scope.mode = $rootScope.getSetting('series.displaymode');

            $scope.setMode = function(mode, temporary) {
                if (!temporary) {
                    $rootScope.setSetting('series.displaymode', mode);
                }
                $scope.mode = mode;
            }

            $scope.go = function(serieID, episode) {
                console.log('doubleclick!', serieID, episode);
                window.location.href = '#/serie/' + serieID + '/episode/' + episode.getID();
            }

            $scope.enableAdd = function() {
                $scope.searchingForSerie = true;
                $scope.serieAddFocus = true;
                $scope.trendingSeries = false;
                $scope.mode = $rootScope.getSetting('series.displaymode');
                $scope.search.query = undefined;
                $scope.search.results = null;
                $scope.selected = '';
            }

            $scope.disableAdd = function() {
                $scope.searchingForSerie = false;
                $scope.mode = $rootScope.getSetting('series.displaymode');
            }

            $scope.enableTrending = function() {
                $scope.searchingForSerie = false;
                $scope.trendingSeries = true;
                $scope.mode = 'trending';
                if (!$scope.trending) {
                    $scope.trending = {
                        results: []
                    };
                    TraktTV.findTrending().then(function(res) {
                        $scope.trending.results = res;
                    });
                }

            }

            $scope.disableTrending = function() {
                $scope.trendingSeries = false;
                $scope.mode = $rootScope.getSetting('series.displaymode');
            }


            $scope.activate = function(el) {
                if ($scope.activated) {
                    return $scope.closeDrawer();
                }
                iElement.toggleClass('active');
                $scope.activated = true;
            }

            $scope.closeDrawer = function() {
                if (!$scope.activated) return;
                iElement.toggleClass('active');
                $scope.activated = false;
            }

            $scope.removeFromFavorites = function(serie) {
                var dlg = $dialogs.confirm($filter('translate')('SERIEDETAILSjs/serie-delete/hdr'),
                    $filter('translate')('SERIEDETAILSjs/serie-delete-question/p1') +
                    serie.name +
                    $filter('translate')('SERIEDETAILSjs/serie-delete-question/p2')
                );
                dlg.result.then(function(btn) {
                    console.log("Remove from favorites!", serie);
                    FavoritesService.remove(serie);
                    $location.path('/')
                }, function(btn) {
                    $scope.confirmed = $filter('translate')('SERIEDETAILSjs/serie-delete-confirmed');
                });
            }

            $scope.setActiveSeason = function(season) {
                CRUD.FindOne('Season', {
                    ID_Season: season.ID_Season
                }).then(function(season) {
                    $scope.activeSeason = season;
                    $scope.$digest();
                })
            }

            $scope.getAirDate = function(serie) {
                return new Date(serie.firstaired).toString()
            }

            $scope.localFilterString = '';

            $scope.setFilter = function(val) {
                $scope.localFilterString = val;
            }
            $scope.localFilter = function(el) {
                return el.name.toLowerCase().indexOf($scope.localFilterString.toLowerCase()) > -1;
            }

            $scope.execFilter = function() {
                $location.path("/series/" + $scope.favorites.filter($scope.localFilter)[0].TVDB_ID);
            }

            $scope.findSeries = function() {
                return TraktTV.disableBatchMode().findSeries($scope.search.query).then(function(res) {
                    TraktTV.enableBatchMode();
                    $scope.search.results = res.series;
                });
            };

            $scope.selectFirstResult = function() {
                var serie = $scope.search.results[0];
                $scope.selectSerie(serie);
            }

            $scope.selectSerie = function(serie) {
                $scope.selected = serie.name;
                $scope.searchingForSerie = true;
                $scope.adding[serie.tvdb_id] = true;
                TraktTV.enableBatchMode().findSerieByTVDBID(serie.tvdb_id).then(function(serie) {
                    FavoritesService.addFavorite(serie).then(function() {
                        $rootScope.$broadcast('storage:update');
                        $scope.adding[serie.tvdb_id] = false;
                    });
                });
            }

            $scope.isAdded = function(tvdb_id) {
                return FavoritesService.hasFavorite(tvdb_id.toString());
            }

            $scope.isAdding = function(tvdb_id) {
                return ((tvdb_id in $scope.adding) && ($scope.adding[tvdb_id] === true))
            }

            $scope.adding = {};
            $scope.favorites = [];
            $scope.searchEngine = 1;


            /**
             * The favorites service fetches data asynchronously via SQLite, we wait for it to emit the favorites:updated event.
             */
            $scope.favorites = FavoritesService.favorites;
            $rootScope.$on('serieslist:hide', function() {
                $scope.closeDrawer();
            });
            $rootScope.$on('favorites:updated', function(event, data) {
                // you could inspect the data to see if what you care about changed, or just update your own scope
                if (FavoritesService.favorites != $scope.favorites) $scope.favorites = FavoritesService.favorites;
                if (!$scope.favorites || (FavoritesService.favorites && FavoritesService.favorites.length == 0)) {
                    $rootScope.$broadcast('serieslist:empty');
                } else {
                    FavoritesService.loadRandomBackground();
                }
            });
            $rootScope.$on('episodes:inserted', function(event, serie) {
                if (serie.get('fanart') != null) {
                    $rootScope.$broadcast('background:load', serie.get('fanart'));
                }
            });

            $rootScope.$on('serieslist:empty', function(event) {
                this.activate();
            }.bind($scope));

            $scope.$watch('favorites', function(nw) {
                if (nw.length == 0) {
                    $scope.enableTrending();
                }
            });



        }
    }
})
