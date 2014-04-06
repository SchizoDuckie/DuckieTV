angular.module('DuckieTV.directives.seriedetails', ['dialogs'])

.directive('serieDetails', function(FavoritesService, $location, $dialogs) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: "templates/serieDetails.html",
        link: function($scope) {

            $scope.removeFromFavorites = function(serie) {
                var dlg = $dialogs.confirm('Delete serie?', 'Do you really want to delete ' + serie.name + ' from your favorites?');
                dlg.result.then(function(btn) {
                    console.log("Remove from favorites!", serie);
                    FavoritesService.remove(serie);
                    $location.path('/')
                }, function(btn) {
                    $scope.confirmed = 'You confirmed "No."';
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
        }
    }
})