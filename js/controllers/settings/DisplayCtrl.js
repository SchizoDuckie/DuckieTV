/**
 * DisplayCtrl containing the controller for the Display Settings and Language Settings
 *
 * Controller for the display settings tab
 */
DuckieTV.controller('DisplayCtrl', ["$scope", "$injector", "SettingsService",
    function($scope, $injector, SettingsService ) {

        $scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);
        $scope.hasNotifications = ('chrome' in window && 'notifications' in window.chrome && 'create' in window.chrome.notifications && 'getPermissionLevel' in window.chrome.notifications);
        $scope.topSites = SettingsService.get('topSites.enabled');
        $scope.topSitesMode = SettingsService.get('topSites.mode');
        $scope.bgOpacity = SettingsService.get('background-rotator.opacity');
        $scope.showRatings = SettingsService.get('download.ratings');
        $scope.sgEnabled = SettingsService.get('library.seriesgrid');
        $scope.notWatchedEpsBtn =  SettingsService.get('series.not-watched-eps-btn');
        $scope.mcEnabled =  !SettingsService.get('font.bebas.enabled');

        $scope.togglenotWatchedEpsBtn = function() {
            $scope.notWatchedEpsBtn = !$scope.notWatchedEpsBtn;
            SettingsService.set('series.not-watched-eps-btn', $scope.notWatchedEpsBtn);
        };

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

        // Toggles the Series-Grid on Series-List
        $scope.toggleSeriesGrid = function() {
            $scope.sgEnabled = !$scope.sgEnabled;
            SettingsService.set('library.seriesgrid', $scope.sgEnabled);
            window.location.reload();
        };

        // Toggles the bebas enabled font (for mixed case display)
        $scope.toggleMixedCase = function() {
            $scope.mcEnabled = !$scope.mcEnabled;
            if ($scope.mcEnabled) {
                localStorage.setItem('font.bebas.disabled', "true");                
            } else {
                localStorage.removeItem('font.bebas.disabled');                
            }
            SettingsService.set('font.bebas.enabled', !$scope.mcEnabled);
            window.location.reload();
        };
    }
]);