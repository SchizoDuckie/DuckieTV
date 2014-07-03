angular.module('DuckieTV.controllers.timer', ['DuckieTV.providers.eventscheduler'])

.controller('TimerCtrl', function($scope, $rootScope, EventSchedulerService, EventWatcherService) {

    $scope.timers = [];
    $scope.timerFired = false;

    $scope.fire = function(timer) {
        console.log('Timer fired manually!', timer);
        EventWatcherService.onEvent(timer.name);
    }

    /**
     * Debug function to reschedule an alarm for every 1 minutes.
     */
    $scope.reschedule = function(timer, minutes) {
        chrome.alarms.create(timer.name, {
            periodInMinutes: minutes
        });
        console.log(timer.name + ' set to fire in ' + minutes + ' minute/s');
        refresh();
    }

    $scope.removeTimer = function(timer) {
        EventSchedulerService.clear(timer.name);
        refresh();

    }

    $scope.fixMissingTimers = function() {
        EventSchedulerService.fixMissingTimers();
    }

    $scope.clearAllTimers = function() {
        chrome.alarms.clearAll(function() {
            $scope.timers = [];
        });
    }

    refresh = function() {
        EventSchedulerService.getAll().then(function(res) {
            $scope.timers = res;
        })
    }

    $scope.injectTimer = function() {
        EventSchedulerService.createInterval('** Episode Aired -> Torrent Availability check service', 60, 'episode:aired:check', {});
        refresh();
    }

    $rootScope.$on('timer:created', function(evt) {
        refresh();
    });

    $rootScope.$on('timer:fired', function(evt, data) {
        console.log("Timer was fired! ", evt, data);
        $scope.timerFired = data;
    });

    refresh();

});