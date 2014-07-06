angular.module('DuckieTV.providers.eventwatcher', [])

/**
 * The eventwatcher factory handles incoming chrome alarms
 * It finds the corresponding information from the ScheduledEvent table and broadcasts it's event
 * with the parameters to make code run in the background.
 */
.provider("EventWatcherService", function() {

    this.$get = function($rootScope) {

        getScheduledEventByName = function(name) {
            return CRUD.FindOne('ScheduledEvent', {
                name: name
            });
        }
        var service = {
            /**
             * When the event watcher's has been initialized, this catches the chrome alarm when it fires
             * and broadcasts the detailed event stored in the ScheduledEvent table
             */
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

            },
            /**
             * Start listening for alarms fired by chrome's extension. needs to be called manually
             */
            initialize: function() {
                chrome.alarms.onAlarm.addListener(function(event) {
                    service.onEvent(event.name);
                })
            }
        };
        return service;
    }
})