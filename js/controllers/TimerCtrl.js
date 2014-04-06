angular.module('DuckieTV.controllers.timer', ['DuckieTV.providers.eventscheduler'])

.controller('TimerCtrl', function($scope, $rootScope, EventSchedulerService) {

    $scope.timers = [];
    $scope.timerFired = false;

    $scope.create = function() {
        EventSchedulerService.createAt('single timer!', new Date().getTime() + 60 * 1000, 'timer:fired', {
            'w00t': '/\o/'
        });
        refresh();
    }

    refresh = function() {
        EventSchedulerService.getAll().then(function(res) {
            $scope.timers = res;
        })
    }

    $rootScope.$on('timer:fired', function(evt, data) {
    	console.log("Timer was fired! ", evt, data);
    	$scope.timerFired = data;
    });

    refresh();

});