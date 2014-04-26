angular.module('DuckieTV.controllers.main', [])


/**
 * Main controller: Kicks in favorites display
 */
.controller('MainCtrl',
    function($scope, $rootScope, $location, $filter, FavoritesService, TraktTV) {
        var favorites = [];
        $scope.searchEngine = 1;


        /**
         * The favorites service fetches data asynchronously via SQLite, we wait for it to emit the favorites:updated event.
         */
        $scope.favorites = FavoritesService.favorites;
        $scope.$on('favorites:updated', function(event, data) {
            // you could inspect the data to see if what you care about changed, or just update your own scope
            if (FavoritesService.favorites != $scope.favorites) $scope.favorites = FavoritesService.favorites;
            if (!$scope.favorites || (FavoritesService.favorites && FavoritesService.favorites.length == 0)) {
                $rootScope.$broadcast('serieslist:empty');
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


    })