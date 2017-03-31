/**
 * <query-monitor> directive that shows when database writes are happening and how many are left
 */
DuckieTV.directive('queryMonitor', ["$filter",
    function($filter) {
        return {
            restrict: 'E',
            templateUrl: 'templates/querymonitor.html',
            link: function($scope, iElement) {

                var unloadBreaker = $filter('translate')('QUERYMONITORjs/close-tab-prompt/lbl');

                $scope.queryStats = CRUD._log;
                progress = 100;

                CRUD.addStatsListener(function(stats) {
                    $scope.queryStats = stats;
                    $scope.progress = Math.floor((stats.writesExecuted / stats.writesQueued) * 100);
                    window.onbeforeunload = (stats.writesExecuted < stats.writesQueued) ? unloadBreaker : null;
                    if (stats.writesExecuted == stats.writesQueued) {
                        $scope.$digest();
                    }
                });
            }
        }
    }
]);