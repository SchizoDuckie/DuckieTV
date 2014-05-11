angular.module('DuckieTV.providers.eventwatcher', [])

.provider("EventWatcherService", function() {

    this.$get = function($rootScope) {

        getScheduledEventByName = function(name) {
            return CRUD.FindOne('ScheduledEvent', {
                name: name
            });
        }
        return {
            onEvent: function(event) {
                console.log("Event was fired!", event);
                getScheduledEventByName(event).then(function(alarm) {
                    if (!alarm) return;
                    if (alarm.get("type") == "single") {
                        console.log("Single alarm: Deleting.");
                        alarm.Delete();
                    }
                    $rootScope.$broadcast(alarm.get('eventchannel'), angular.fromJson(alarm.get('data')));

                }, function(err) {
                    console.log("Could not find an event with name ", event, name);
                });

            }
        };
    }
})