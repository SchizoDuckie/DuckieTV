/**
 * controller for the autoBackup dialogue
 */
DuckieTV.controller('backupDialogCtrl', ['$scope', "$uibModalInstance", "data",
    function($scope, $modalInstance, data) {
        $scope.backupString = data.backupString;
        $scope.backupTime = data.backupTime;

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        /**
         * Force the download. and store lastrun.
         */
        $scope.createBackup = function() {
            var filename = 'DuckieTV %s.backup'.replace('%s', $filter('date')(new Date(), 'shortDate'));
            download(backupString, filename, 'application/json');
            $modalInstance.dismiss('Canceled');
            localStorage.setItem('autobackup.lastrun', new Date().getTime());
        };
    }
])