/**
 * DisplayCtrl containing the controller for the Display Settings and Language Settings
 *
 * Controller for the display settings tab
 */
DuckieTV.controller('DisplayCtrl', ["$scope", "$injector", "SettingsService",
    function($scope, $injector, SettingsService ) {

        $scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);
        $scope.topSites = SettingsService.get('topSites.enabled');
        $scope.topSitesMode = SettingsService.get('topSites.mode');
        $scope.bgOpacity = SettingsService.get('background-rotator.opacity');
        $scope.showRatings = SettingsService.get('download.ratings');
        $scope.sgEnabled = SettingsService.get('library.seriesgrid');
        $scope.notWatchedEpsBtn =  SettingsService.get('series.not-watched-eps-btn');
        $scope.mixedCase = SettingsService.get('display.mixedcase');

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

        // Toggles mixedCase (helvetica) or upperCase (bebasregular)
        $scope.toggleMixedcase = function() {
            $scope.mixedCase = !$scope.mixedCase;
            SettingsService.set('display.mixedcase', $scope.mixedCase);
            $injector.get('DuckietvReload').windowLocationReload();
        };

        // Toggles the Series-Grid on Series-List
        $scope.toggleSeriesGrid = function() {
            $scope.sgEnabled = !$scope.sgEnabled;
            SettingsService.set('library.seriesgrid', $scope.sgEnabled);
            $injector.get('DuckietvReload').windowLocationReload();
        };
    }
]);