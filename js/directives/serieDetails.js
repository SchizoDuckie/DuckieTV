angular.module('DuckieTV.directives.seriedetails', [])

.directive('serieDetails', function(FavoritesService, $location) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: "templates/serieDetails.html",
        link: function($scope) {

            $scope.removeFromFavorites = function(serie) {
                console.log("Remove from favorites!", serie);
                FavoritesService.remove(serie);
                $location.path('/');
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
        }
    }
})