/*
 * Controller for the calendar settings tab
 */
DuckieTV.controller('CalendarCtrl', ["$scope",  "SettingsService",
    function($scope, SettingsService) {

        $scope.showSpecials = SettingsService.get('calendar.show-specials');
        $scope.startSunday = SettingsService.get('calendar.startSunday');
        $scope.displayMode = SettingsService.get('calendar.mode');
        $scope.showDownloaded = SettingsService.get('calendar.show-downloaded');

        // Toggle if calendar shows specials or not
        $scope.toggleSpecials = function() {
            $scope.showSpecials = !$scope.showSpecials;
            SettingsService.set('calendar.show-specials', $scope.showSpecials);
        };

        // Toggles calendar starting on Sunday or Monday
        $scope.toggleCalendarStartDay = function() {
                $scope.startSunday = !$scope.startSunday;
                SettingsService.set('calendar.startSunday', $scope.startSunday);
        };

        // Toggles calendar view mode, week or month
        $scope.toggleCalendarDisplayMode = function() {
            $scope.displayMode = $scope.displayMode == 'date' ? 'week' : 'date';
                SettingsService.set('calendar.mode', $scope.displayMode);
        };

        // Toggles wether downloaded episodes are highlighed on the Calendar
        $scope.toggleDownloaded = function() {
            $scope.showDownloaded = !$scope.showDownloaded;
            SettingsService.set('calendar.show-downloaded', $scope.showDownloaded);
        };
        
    }
])