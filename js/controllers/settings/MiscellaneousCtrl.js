/*
 * Controller for the miscellaneous settings tab
 */
DuckieTV.controller('MiscellaneousCtrl', ["$scope", "$rootScope", "$injector", "SettingsService",
    function($scope, $rootScope, $injector, SettingsService) {

        $scope.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing');

        // Toggles whether the episodes watched and downloaded states should be paired
        $scope.togglewatchedDownloadedPaired = function() {
            $scope.watchedDownloadedPaired = !$scope.watchedDownloadedPaired;
            SettingsService.set('episode.watched-downloaded.pairing', $scope.watchedDownloadedPaired);
        };

    }
])