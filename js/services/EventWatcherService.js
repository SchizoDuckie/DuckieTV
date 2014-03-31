angular.module('DuckieTV.providers.eventwatcher', [])

.provider("EventWatcherService", function() {

    this.$get = function($rootScope) {
        return {
            onEvent: function(event) {
                console.log("Event was fired!", event);
                // $alarm = getScheduledEventByName(eventName);
                $rootScope.$broadcast(alarm.get('eventchannel'), alarm.get('data'))
                debugger;
            }
        }
    };
})