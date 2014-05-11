angular.module('DuckieTV.controllers.timer', ['DuckieTV.providers.eventscheduler'])

.controller('TimerCtrl', function($scope, $rootScope, EventSchedulerService, EventWatcherService) {

    $scope.timers = [];
    $scope.timerFired = false;

    $scope.fire = function(timer) {
        console.log('Timer fired manually!', timer);
        EventWatcherService.onEvent(timer.name);
    }

    /**
     * Debug function to reschedule an alarm for every 2 minutes.
     */
    $scope.reschedule = function(timer, minutes) {
        chrome.alarms.create(timer.name, {
            periodInMinutes: minutes
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