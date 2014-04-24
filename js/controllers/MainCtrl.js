angular.module('DuckieTV.controllers.main', [])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl',
    function($scope, $rootScope, $location, $filter, FavoritesService, TraktTV) {
        var favorites = [];
        $scope.searchEngine = 1;
        $scope.searchingForSerie = false;
        $scope.mode = $rootScope.getSetting('series.displaymode');

        $scope.setMode = function(mode, temporary) {
            if (!temporary) {
                $rootScope.setSetting('series.displaymode', mode);
            }
            $scope.mode = mode;
        }

        $scope.enableAdd = function() {
            $scope.searchingForSerie = true;
        }

        $scope.disableAdd = function() {
            $scope.searchingForSerie = false;
            console.log("Disable!");
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


        /**
         * The favorites service fetches data asynchronously via SQLite, we wait for it to emit the favorites:updated event.
         */
        $scope.favorites = FavoritesService.favorites;
        $scope.$on('favorites:updated', function(event, data) {
            // you could inspect the data to see if what you care about changed, or just update your own scope
            if (FavoritesService.favorites != $scope.favorites) $scope.favorites = FavoritesService.favorites;
            if (!$scope.favorites || (FavoritesService.favorites && FavoritesService.favorites.length == 0)) {
                $scope.enableAdd();
            } else {
                var serie = $scope.favorites[Math.floor(Math.random() * $scope.favorites.length)];
                $rootScope.$broadcast('background:load', serie.fanart);
            }
        });
        $scope.$on('episodes:inserted', function(event, serie) {
            if (serie.get('fanart') != null) {
                $rootScope.$broadcast('background:load', serie.get('fanart'));
            }
        });

        /**
         * Typeahead add functions
         */
        $scope.search = {
            query: undefined,
            results: null
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
            $scope.searchingForSerie = false;
            $scope.search.query = undefined;
            $scope.search.results = null;
            TraktTV.enableBatchMode().findSerieByTVDBID(serie.tvdb_id).then(function(serie) {
                FavoritesService.addFavorite(serie).then(function() {
                    $rootScope.$broadcast('storage:update');
                });
            });

            $scope.selected = '';
        }
    })