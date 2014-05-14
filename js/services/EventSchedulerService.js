angular.module('DuckieTV.providers.eventscheduler', ['DuckieTV.providers.eventwatcher'])

/**
 * A wrapper around chrome.alarms
 * Since chrome.alarms can only store a simple string that's fired when the alarm is
 * executed, this catches them and fires them off into the EventWatcherService, that will
 * resolve the actual alarm's detailed information and broadcast event so that it can be handled
 * by the class that scheduled it
 */
.provider("EventSchedulerService", function() {

    this.$get = function(EventWatcherService, $q, $rootScope) {

        var createEvent = function(name, type, eventChannel, data) {
            var evt = new ScheduledEvent();
            evt.set('name', name)
            evt.set('type', type);
            evt.set('eventchannel', eventChannel);
            evt.set('data', angular.toJson(data, true));
            evt.Persist().then(function() {
                console.log("Created new event!", evt);
            });
        };


        var service = {
            get: function(title) {
                return chrome.alarms.get(title)
            },
            getAll: function() {
                var p = $q.defer();
                chrome.alarms.getAll(function(result) {
                    p.resolve(result);
                });
                return p.promise;
            },
            createAt: function(name, timestamp, eventChannel, data) {
                createEvent(name, 'single', eventChannel, data);
                chrome.alarms.create(name, {
                    when: timestamp
                });
            },
            createDelay: function(name, delayInMinutes, eventChannel, data) {
                createEvent(name, 'single', eventChannel, data);
                chrome.alarms.create(name, {
                    delayInMinutes: delayInMinutes
                });
            },
            createInterval: function(name, periodInMinutes, eventChannel, data) {
                CRUD.FindOne('ScheduledEvent', {
                    name: name
                }).then(function(ScheduledEvent) {
                    if (ScheduledEvent) {
                        ScheduledEvent.set(data, angular.toJson(data, true));
                        ScheduledEvent.Persist();
                    } else {
                        createEvent(name, 'interval', eventChannel, data);
                    }
                    chrome.alarms.create(name, {
                        periodInMinutes: periodInMinutes
                    });
                    $rootScope.$broadcast('timer:created');

                })

            },
            clear: function(event) {
                chrome.alarms.clear(event);
                return event.Delete();
            },
            clearAll: function() {
                chrome.alarms.clearAll();
            },
            /**
             * In case there's timers in the eventscheduler database but chrome.timers.clear(); has been run, this repopulates chrome's timers
             * by firing them.
             */
            fixMissingTimers: function() {
                service.getAll().then(function(timers) {
                    console.log("Fixing missing timers check");
                    CRUD.Find('ScheduledEvent', {}).then(function(events) {

                        var missing = events.filter(function(event) {
                            return timers.filter(function(timer) {
                                return timer.name == event.get('name');
                            }).length === 0;
                        });

                        for (var i = 0; i < missing.length; i++) {
                            console.log("Re-adding show for missing timer by firing it's timer: ", missing[i].get('name'));
                            EventWatcherService.onEvent(missing[i].get('name'));
                        }
                    });
                });
            }
        };
        return service;
    }
})