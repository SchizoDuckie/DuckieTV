angular.module('DuckieTV.controllers.timer', ['DuckieTV.providers.eventscheduler', 'DuckieTV.providers.alarms'])

.controller('TimerCtrl', function($scope, $rootScope, AlarmService, EventSchedulerService, EventWatcherService) {

    $scope.timers = [];
    $scope.timerFired = false;
    $scope.orderPreference = 'sortName';

    /**
     * Safety check to prevent multiple launching of intensive timer functions 
     * like FireAll0 or FixMissing1 getting pressed twice
     */
    var theFireAlarm = [false, false];

    $scope.fire = function(timer) {
        console.log('Manually firing timer', timer.name);
        EventWatcherService.onEvent(timer.name);
    };

    $scope.fireAll = function() {
        if (theFireAlarm[0] == true) return;
        theFireAlarm[0] = true;
        $scope.timers.map(function(timer) {
            console.log('Manually firing timer', timer.name);
            $scope.fire(timer);
        })
    };

    /**
     * Debug function to reschedule an alarm for every 1 minutes.
     */
    $scope.reschedule = function(timer, minutes) {
        AlarmService.createInterval(timer.name, minutes);
        console.log(timer.name + ' set to fire in ' + minutes + ' minute/s');
        refresh();
    };

    $scope.removeTimer = function(timer) {
        console.info("Removing timer", timer.name)
        EventSchedulerService.clear(timer.name);
        refresh();
    };

    $scope.fixMissingTimers = function() {
        if (theFireAlarm[1] == true) return;
        theFireAlarm[1] = true;
        console.info("Fixing missing timers");
        EventSchedulerService.fixMissingTimers();
    };

    $scope.clearAllTimers = function() {
        AlarmService.clearAll();
        $scope.timers = [];
    };

    $scope.deleteAllTimers = function() {
        EventSchedulerService.clearAll();
        $scope.timers = [];
    };

    var titleSorter = function(timer) {
        timer.sortName = timer.name.replace('The ', '');
        return timer;
    };

    refresh = function() {
        EventSchedulerService.getAll().then(function(res) {
            $scope.timers = res.map(titleSorter);
        });
    }

    $scope.injectTimer = function() {
        EventSchedulerService.createInterval('$$$$ Episode Aired - Torrent Availability check service', 60, 'episode:aired:check', {});
        refresh();
    };

    $rootScope.$on('timer:created', function(evt) {
        refresh();
    });

    $rootScope.$on('timer:fired', function(evt, data) {
        console.info("Timer was fired! ", evt, data);
        $scope.timerFired = data;
    });

    refresh();
});