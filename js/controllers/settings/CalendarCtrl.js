/*
 * Controller for the calendar settings tab
 */
DuckieTV.controller('CalendarCtrl', ["$scope", "$rootScope", "$injector", "SettingsService",
    function($scope, $rootScope, $injector, SettingsService) {

        $scope.showSpecials = SettingsService.get('calendar.show-specials');
        $scope.startSunday = SettingsService.get('calendar.startSunday');
        $scope.displayMode = SettingsService.get('calendar.mode');
        $scope.showDownloaded = SettingsService.get('calendar.show-downloaded');
        $scope.showEpisodeNumbers = SettingsService.get('calendar.show-episode-numbers');

        // Toggle if calendar shows specials or not
        $scope.toggleSpecials = function() {
            $scope.showSpecials = !$scope.showSpecials;
            SettingsService.set('calendar.show-specials', $scope.showSpecials);
            window.location.reload();
        };

        // Toggles calendar starting on Sunday or Monday
        $scope.toggleCalendarStartDay = function() {
            $scope.startSunday = !$scope.startSunday;
            SettingsService.set('calendar.startSunday', $scope.startSunday);
            window.location.reload();
        };

        // Toggles calendar view mode, week or month
        $scope.toggleCalendarDisplayMode = function() {
            $scope.displayMode = $scope.displayMode == 'date' ? 'week' : 'date';
            SettingsService.set('calendar.mode', $scope.displayMode);
            window.location.reload();
        };

        // Toggles whether downloaded episodes are highlighted on the Calendar
        $scope.toggleDownloaded = function() {
            $scope.showDownloaded = !$scope.showDownloaded;
            SettingsService.set('calendar.show-downloaded', $scope.showDownloaded);
        };

        // Toggles whether event titles should include the season and episode numbers on the Calendar
        $scope.toggleEpisodeNumbers = function() {
            $scope.showEpisodeNumbers = !$scope.showEpisodeNumbers;
            SettingsService.set('calendar.show-episode-numbers', $scope.showEpisodeNumbers);
        };

    }
])