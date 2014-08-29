angular.module('DuckieTV.directives.seriedetails', ['dialogs'])

/** 
 * The serie-details directive is what handles the overview for a tv-show.
 * It shows show details, actors, if it's still airing, the individual seasons and the delete show button.
 */
.directive('serieDetails', function(FavoritesService, $location, $dialogs, $filter) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: "templates/serieDetails.html",
        link: function($scope) {
            /**
             * Show the user a delete confirmation dialog before removing the show from favorites.
             * If confirmed: Remove from favorites and navigate back to the calendar.
             *
             * @param object serie Plain Old Javascript Object to delete
             */
            $scope.removeFromFavorites = function(serie) {
                var dlg = $dialogs.confirm($filter('translate')('SERIEDETAILSjs/serie-delete/hdr'),
                    $filter('translate')('SERIEDETAILSjs/serie-delete-question/p1') +
                    serie.name +
                    $filter('translate')('SERIEDETAILSjs/serie-delete-question/p2')
                );
                dlg.result.then(function(btn) {
                    console.log("Remove from favorites!", serie);
                    FavoritesService.remove(serie);
                    $location.path('/');
                }, function(btn) {
                    $scope.confirmed = $filter('translate')('SERIEDETAILSjs/serie-delete-confirmed');
                });
            };

            /**
             * Set the active season to one of the seaons passed to thedirective
             * @param object Season Plain Old Javascript Object season to fetch
             */
            $scope.setActiveSeason = function(season) {
                CRUD.FindOne('Season', {
                    ID_Season: season.ID_Season
                }).then(function(season) {
                    $scope.activeSeason = season;
                    $scope.$digest();
                });
            };

            /**
             * Format the airdate for a serie
             * @param object serie Plain Old Javascript Object
             * @return string formatted date
             */
            $scope.getAirDate = function(serie) {
                return new Date(serie.firstaired).toString();
            };

            /**
             * Hide or display a show on the calendar
             * @param object serie Plain Old Javascript Object
             * 
             * Because this method edits the db directly, dynamically updating
             * requires some more work involving brodcasting an event, for now, 
             * it just reloads the page after the db has been updated
             */
            $scope.toggleSerieDisplay = function(serie) {
                CRUD.FindOne('Serie', {
                    ID_Serie: serie.ID_Serie
                }).then(function(serie2) {
                    if(serie2.get('displaycalendar') == 1) {
                        serie2.set('displaycalendar', 0);
                    } else {
                        serie2.set('displaycalendar', 1);
                    }
                    serie2.Persist().then(function(result) {
                        window.location.reload(false);
                    });
                });
            }
        }
    };
});
