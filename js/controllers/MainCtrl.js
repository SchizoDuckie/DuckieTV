angular.module('DuckieTV.controllers.main', [])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl',
    function($scope, $rootScope, FavoritesService) {
        var favorites = [];
        $scope.searchEngine = 1;
        $scope.searchingForSerie = false;
        $scope.mode = $rootScope.getSetting('series.displaymode');

        $scope.setMode = function(mode) {
            $rootScope.setSetting('series.displaymode', mode);
            $scope.mode = mode;
        }

        $scope.enableAdd = function() {
            $scope.searchingForSerie = true;
        }

        $scope.disableAdd = function() {
            $scope.searchingForSerie = false;
            console.log("Disable!");
        }

        /**
         * The favorites service fetches data asynchronously via SQLite, we wait for it to emit the favorites:updated event.
         */
        $scope.favorites = FavoritesService.favorites;
        $scope.$on('favorites:updated', function(event, data) {
            // you could inspect the data to see if what you care about changed, or just update your own scope
            $scope.favorites = data.favorites;
            if (!$scope.favorites || (data.favorites && data.favorites.length == 0)) {
                $scope.enableAdd();
            } else {
                var serie = data.favorites[Math.floor(Math.random() * data.favorites.length)];
                $rootScope.$broadcast('background:load', serie.fanart);
            }
        });
        $scope.$on('episodes:inserted', function(event, serie) {
            if (serie.get('fanart') != null) {
                $rootScope.$broadcast('background:load', serie.get('fanart'));
            }
        });
    })