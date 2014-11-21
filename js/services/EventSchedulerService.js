angular.module('DuckieTV.providers.eventscheduler', ['DuckieTV.providers.eventwatcher', 'DuckieTV.providers.alarms'])

/**
 * A wrapper around chrome.alarms
 * Since chrome.alarms can only store a simple string that's fired when the alarm is
 * executed, this catches them and fires them off into the EventWatcherService, that will
 * resolve the actual alarm's detailed information and broadcast event so that it can be handled
 * by the class that scheduled it
 */
.provider("EventSchedulerService", function() {

    this.$get = function(EventWatcherService, AlarmService, $q, $rootScope) {
        /**
         * Create a new ScheduledEvent entity
         * @param  string name Readable name of the event
         * @param  string type Can be any one the provided types: 'single' or 'interval'
         * @param  string eventChannel event channel to fire with $rootScope.$broadcast when the alarm triggers
         * @param  string data JSON encoded data string to pass to the broadcast event
         */
        var createEvent = function(name, type, eventChannel, data) {
            var evt = new ScheduledEvent();
            evt.set('name', name);
            evt.set('type', type);
            evt.set('eventchannel', eventChannel);
            evt.set('data', angular.toJson(data, true));
            evt.Persist().then(function() {
                console.log("Created new event!", evt);
            });
        };


        var service = {
            /**
             * Fetch the alarm from chrome.alarms if we're in chrome
             * @param  string title name of the alarm
             * @return mixed Alarm || null
             */
            get: function(title) {
                return ('chrome' in window) ? chrome.alarms.get(title) : null;
            },

            /**
             * Fetch an array of all chrome alarms
             * @return promise
             */
            getAll: function() {
                return AlarmService.getAll().then(function(alarms) {
                    return alarms;
                });
            },

            /**
             * Create a single alarm at a specific point in time
             * @param  string name humanly readable alarm name
             * @param  int timestamp timestamp to fire the alarm at
             * @param  string eventChannel event channel to broadcast when this alarm fires
             * @param  string JSON encoded alarm data to pass to the event
             */
            createAt: function(name, timestamp, eventChannel, data) {
                createEvent(name, 'single', eventChannel, data);
                return AlarmService.createAt(name, timestamp);

            },

            /**
             * Create a single alarm that fires after a specific delay in minutes.
             * @param  string name humanly readable alarm name
             * @param  int timestamp timestamp to fire the alarm at
             * @param  string eventChannel event channel to broadcast when this alarm fires
             * @param  string JSON encoded alarm data to pass to the event
             */
            createDelay: function(name, delayInMinutes, eventChannel, data) {
                createEvent(name, 'single', eventChannel, data);
                return AlarmService.createDelay(name, delayInMinutes);
            },

            /**
             * Create an alarm that repeatedly fires after a period in minutes
             * @param  string name humanly readable alarm name
             * @param  int timestamp timestamp to fire the alarm at
             * @param  string eventChannel event channel to broadcast when this alarm fires
             * @param  string JSON encoded alarm data to pass to the event
             */
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
                    AlarmService.createInterval(name, periodInMinutes);
                    $rootScope.$broadcast('timer:created');
                });

            },

            /**
             * Remove both the chrome alarm  and the ScheduledEvent
             * @param  string name name of the alarm to remove
             */
            clear: function(name) {
                AlarmService.clear(name);

                CRUD.FindOne('ScheduledEvent', {
                    name: name
                }).then(function(ScheduledEvent) {
                    ScheduledEvent.Delete();
                });
            },

            /**
             * Remove all alarms that are registered and the Scheduled Events
             * @return {[type]}
             */
            clearAll: function() {
                AlarmService.clearAll();
                CRUD.Find('ScheduledEvent', {}).then(function(ScheduledEvents) {
                    ScheduledEvents.map(function(el) {
                        el.Delete();
                    });
                });
            },

            /**
             * In case there's timers in the eventscheduler database but chrome.timers.clear(); has been run, this repopulates chrome's timers
             * by firing them.
             */
            fixMissingTimers: function() {
                service.getAll().then(function(timers) {
                    console.log("Fixing missing timers check ");
                    CRUD.Find('ScheduledEvent', {}).then(function(events) {

                        var missing = events.filter(function(event) {
                            return timers.filter(function(timer) {
                                return timer.name == event.get('name') || event.get('name').indexOf('☠') > -1;
                            }).length === 0;
                        });

                        for (var i = 0; i < missing.length; i++) {
                            console.log("Re - adding show for missing timer by firing it 's timer: ", missing[i].get('name'));
                            EventWatcherService.onEvent(missing[i].get('name'));
                        }
                    });
                });
            }
        };
        return service;
    };
});