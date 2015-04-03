DuckieTV.controller('CalendarCtrl', ["$scope", "$rootScope", "$filter", "SettingsService",
    function($scope, $rootScope, $filter, SettingsService) {

        $scope.showSpecials = SettingsService.get('calendar.show-specials');
        $scope.customadEventLimit = $scope.adEventLimit = SettingsService.get('calendar.event-limit');

        // Toggle if calendar shows specials or not
        $scope.toggleSpecials = function() {
            if ($scope.showSpecials == true) {
                SettingsService.set('calendar.show-specials', false);
                $scope.showSpecials = false;
            } else {
                SettingsService.set('calendar.show-specials', true);
                $scope.showSpecials = true;
            }
            // $rootScope.$broadcast('favorites:updated');
        };
        /**
         * Changes the calendar's day boxex event-limit 
         */
        $scope.setadEventLimit = function(eventLimit) {
            SettingsService.set('calendar.event-limit', eventLimit);
            $scope.adEventLimit = eventLimit;
            window.location.reload(); // force reload to apply settings to calendar
        };
    }
])