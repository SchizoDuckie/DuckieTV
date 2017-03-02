/**
 * controller for the autoBackup dialogue
 */
DuckieTV.controller('backupDialogCtrl', ['$scope', "$uibModalInstance", "$filter", "BackupService",
    function($scope, $modalInstance, $filter, BackupService) {

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        /**
         * Create backup via download service and force the download.
         */
        $scope.createBackup = function() {
            BackupService.createBackup().then(function(backupString) {
                var filename = 'DuckieTV %s.backup'.replace('%s', $filter('date')(new Date(), 'shortDate'));
                download(backupString, filename, 'application/json');
            });
            $modalInstance.dismiss('Canceled');
            localStorage.setItem('autobackup.lastrun', new Date().getTime());
        };
    }
])