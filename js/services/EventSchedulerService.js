angular.module('DuckieTV.providers.eventscheduler', ['DuckieTV.providers.eventwatcher'])

/**
 * A wrapper around chrome.alarms
 * Since chrome.alarms can only store a simple string that's fired when the alarm is
 * executed, this catches them and fires them off into the EventWatcherService, that will
 * resolve the actual alarm's detailed information and broadcast event so that it can be handled
 * by the class that scheduled it
 */
.provider("EventSchedulerService", function() {

    this.$get = function(EventWatcherService, $q) {

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


        return {
            get: function(title) {
                return chrome.alarms.get(title)
            },
            getAll: function() {
                var p = $q.defer();
                chrome.alarms.getAll(function(result) {
                    console.log("Got results ", result);
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
                console.log("Create interval alarm: ", name, periodInMinutes, eventChannel, data);
                CRUD.FindOne('ScheduledEvent', {
                    name: name
                }).then(function(ScheduledEvent) {
                    if (ScheduledEvent) {
                        console.log("Alarm already exists! updating!");
                        ScheduledEvent.set(data, angular.toJson(data, true));
                        ScheduledEvent.Persist();
                    } else {
                        createEvent(name, 'interval', eventChannel, data);
                        chrome.alarms.create(name, {
                            periodInMinutes: periodInMinutes
                        });
                    }
                })

            },
            clear: function(event) {
                chrome.alarms.clear(event);
                return event.Delete();
            },
            clearAll: function() {
                chrome.alarms.clearAll();
            },
            initialize: function() {
                chrome.alarms.onAlarm.addListener(function(event) {
                    EventWatcherService.onEvent(event.name);
                })
            }
        }
    };
})