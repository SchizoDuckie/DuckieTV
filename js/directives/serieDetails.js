angular.module('DuckieTV.directives.seriedetails', [])

.directive('serieDetails', function(FavoritesService, $location) {
    return {
        restrict: 'E',
        scope: {
            'serie': '=serie',
            'points': '=points'
        },
        templateUrl: "templates/serieDetails.html",
        link: function($scope) {

            $scope.removeFromFavorites = function(serie) {
                console.log("Remove from favorites!", serie);
                FavoritesService.remove(serie);
                $location.path('/');
            }
        }
    }
})