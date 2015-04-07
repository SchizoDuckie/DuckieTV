/*
 * Controller for the calendar settings tab
 */
DuckieTV.controller('CalendarCtrl', ["$scope",  "SettingsService",
    function($scope, SettingsService) {

        $scope.showSpecials = SettingsService.get('calendar.show-specials');
        $scope.startSunday = SettingsService.get('calendar.startSunday');
        $scope.displayMode = SettingsService.get('calendar.mode');

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

        // Toggles calendar starting on Sunday or Monday
        $scope.toggleCalendarStartDay = function() {
            if ($scope.startSunday == true) {
                SettingsService.set('calendar.startSunday', false);
                $scope.startSunday = false;
            } else {
                SettingsService.set('calendar.startSunday', true);
                $scope.startSunday = true;
            }
        };

        // Toggles calendar view mode, week or month
        $scope.toggleCalendarDisplayMode = function() {
            if ($scope.displayMode == 'date') {
                SettingsService.set('calendar.mode', 'week');
                $scope.displayMode = 'week';
            } else {
                SettingsService.set('calendar.mode', 'date');
                $scope.displayMode = 'date';
            }
        };
    }
])