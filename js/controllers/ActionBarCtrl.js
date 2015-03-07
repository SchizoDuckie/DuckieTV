/**
 * Actionbar Controller
 */

DuckieTV.controller('ActionBarCtrl', ["$rootScope", "SeriesListState", "SidePanelState",
    function($rootScope, SeriesListState, SidePanelState) {


        this.hideSeriesList = function() {
            SeriesListState.hide();
        };

        this.toggleSeriesList = function() {
            SeriesListState.toggle()
        };


        this.contractSidePanel = function() {
            SidePanelState.contract()
        };

        this.resetCalendar = function() {
            $rootScope.$broadcast('calendar:setdate', new Date());
        }

    }
])