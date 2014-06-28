angular.module('DuckieTV.directives.seriedetails', ['dialogs'])

.directive('serieDetails', function(FavoritesService, $location, $dialogs, $filter) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: "templates/serieDetails.html",
        link: function($scope) {

            $scope.removeFromFavorites = function(serie) {
                var dlg = $dialogs.confirm($filter('translate')('SERIEDETAILS_JS(delete_serie)hdr'),
                    $filter('translate')('SERIEDETAILS_JS(delete_serie_question)p1') +
                    serie.name +
                    $filter('translate')('SERIEDETAILS_JS(delete_serie_question)p2')
                );
                dlg.result.then(function(btn) {
                    console.log("Remove from favorites!", serie);
                    FavoritesService.remove(serie);
                    $location.path('/')
                }, function(btn) {
                    $scope.confirmed = $filter('translate')('SERIEDETAILS_JS(delete_serie_confirmed)lbl');
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
