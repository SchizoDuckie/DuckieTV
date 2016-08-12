/**
 * Controller for the Settings window
 */
DuckieTV.controller('SettingsCtrl', ["$scope", "$injector",
    function($scope, $injector) {

        /**
         * Closes the SidePanel 
         */
        $scope.closeSidePanel = function() {
            $injector.get('$state').go('calendar');
        }

    }
]);
