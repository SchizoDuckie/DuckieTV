/**
 * Actionbar Controller
 */

DuckieTV.controller('ActionBarCtrl', ["$scope", "SeriesListState", "SidePanelState",
    function($scope, SeriesListState, SidePanelState) {


        $scope.hideSeriesList = function() {
            SeriesListState.hide();
        };

        $scope.toggleSeriesList = function() {
            SeriesListState.toggle()
        };


        $scope.contractSidePanel = function() {
            SidePanelState.contract()
        };


    }
])