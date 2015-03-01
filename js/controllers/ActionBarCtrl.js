/**
 * Actionbar Controller
 */

DuckieTV.controller('ActionBarCtrl', ["$scope", "$rootScope", "SidePanelState",
    function($scope, $rootScope, SidePanelState, FavoritesService) {


        $scope.hideSeriesList = function() {
            $rootScope.$broadcast('serieslist:hide');
        };

        $scope.toggleSeriesList = function() {

            $rootScope.$broadcast('serieslist:toggle');

        };


        $scope.contractSidePanel = function() {
            SidePanelState.contract()
        };


    }
])