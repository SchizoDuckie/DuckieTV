angular.module('DuckieTV.directives.querymonitor',[])

/**
 * <query-monitor> directive that shows when database writes are happening and how many are left
 */
.directive('queryMonitor', function() {

    return {
        restrict: 'E',
        templateUrl: 'templates/querymonitor.html',
        link: function($scope, iElement) {

            var unloadBreaker = function() {
                return 'DuckieTV is still performing database operations. Do you really want to close this tab?';
            } 

            $scope.queryStats = CRUD.stats;
            progress = 100;

            Object.observe(CRUD.stats, function() {
                $scope.queryStats = CRUD.stats;
                $scope.progress = Math.floor(($scope.queryStats.writesExecuted / $scope.queryStats.writesQueued )* 100);
                window.onbeforeunload = ($scope.queryStats.writesExecuted < $scope.queryStats.writesQueued) ? unloadBreaker : null;
                $scope.$digest();
            });

            
        }
    }
});
