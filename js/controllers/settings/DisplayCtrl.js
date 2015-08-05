/**
 * DisplayCtrl containing the controller for the Display Settings and Language Settings
 *
 * Controller for the display settings tab
 */
DuckieTV.controller('DisplayCtrl', ["$scope", "SettingsService",
    function($scope, SettingsService) {

        $scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);
        $scope.topSites = SettingsService.get('topSites.enabled');
        $scope.topSitesMode = SettingsService.get('topSites.mode');
        $scope.bgOpacity = SettingsService.get('background-rotator.opacity');
        $scope.showRatings = SettingsService.get('download.ratings');
        $scope.isStandalone = (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1);
        $scope.standaloneStartupMinimized = localStorage.getItem('standalone.startupMinimized');
        $scope.sgEnabled = SettingsService.get('library.seriesgrid');

        $scope.toggleTopSites = function() {
            $scope.topSites = !$scope.topSites;
            SettingsService.set('topSites.enabled', $scope.topSites);
        };

        $scope.toggleTopSitesMode = function() {
            $scope.topSitesMode = $scope.topSitesMode == "onhover" ? "onclick" : "onhover";
            SettingsService.set('topSites.mode', $scope.topSitesMode);
        };

        // Set the various background opacity levels.
        $scope.setBGOpacity = function(opacity) {
            SettingsService.set('background-rotator.opacity', opacity);
            $scope.bgOpacity = opacity;
        };

        // Toggles whether to show Ratings on Series and Episode panels
        $scope.toggleRatings = function() {
            $scope.showRatings = !$scope.showRatings;
            SettingsService.set('download.ratings', $scope.showRatings);
        };

        // Toggles whether to minimize the Standalone window at startup 
        // stored in localStorage because this code runs early
        $scope.toggleStandaloneStartupMinimized = function() {
            $scope.standaloneStartupMinimized = !$scope.standaloneStartupMinimized;
            localStorage.setItem('standalone.startupMinimized', $scope.standaloneStartupMinimized);
        };

        // Toggles the Series-Grid on Series-List
        $scope.toggleSeriesGrid = function() {
            $scope.sgEnabled = !$scope.sgEnabled;
            SettingsService.set('library.seriesgrid', $scope.sgEnabled);
            window.location.reload();
        };
    }
]);