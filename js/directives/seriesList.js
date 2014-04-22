angular.module('DuckieTV.directives.serieslist', [])

.directive('seriesList', function(FavoritesService) {
    return {
        restrict: 'E',
        transclude: true,
        templateUrl: "templates/home-series.html",
        link: function($scope, iElement) {

            $scope.activated = false;

            $scope.activate = function(el) {
                console.log('Activating!', el);
                if ($scope.activated) {
                    $scope.closeDrawer();
                }
                var d = document.createElement('div');
                d.id = $scope.activeId = 'cover_' + new Date().getTime();
                d.setAttribute('class', 'coverElement');
                d.onclick = function() {
                    document.body.removeChild(d);
                    iElement.toggleClass('active');
                    this.activated = false;
                }.bind($scope)
                document.body.appendChild(d);
                iElement.toggleClass('active');
                $scope.activated = true;
            }

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