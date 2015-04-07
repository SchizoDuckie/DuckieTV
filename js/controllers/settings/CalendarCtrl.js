DuckieTV.controller('CalendarCtrl', ["$scope",  "$filter", "SettingsService",
    function($scope, $filter, SettingsService) {

        $scope.showSpecials = SettingsService.get('calendar.show-specials');

        // Toggle if calendar shows specials or not
        $scope.toggleSpecials = function() {
            if ($scope.showSpecials == true) {
                SettingsService.set('calendar.show-specials', false);
                $scope.showSpecials = false;
            } else {
                SettingsService.set('calendar.show-specials', true);
                $scope.showSpecials = true;
            }
        };
    }
])