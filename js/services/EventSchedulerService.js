angular.module('DuckieTV.providers.eventscheduler', ['DuckieTV.providers.eventwatcher'])

.provider("EventScheduleService", function(EventWatcherService) {
    var ids = {};

    function alarmHandler(event) {
        console.log('An alarm has fired! ', event);
        EventWatcherService.onEvent(event);
    }


    this.$get = function() {
        return {
            get: function(title) {
                chrome.alarms.get(title)
            },
            getAll: function(title, message, items, callback) {
                create({
                    type: "list",
                    title: title,
                    message: message,
                    iconUrl: "img/icon-magnet.png",
                    items: items
                });

            },
            create: function(alarm) {

            },
            clear: function(event) {
                chrome.alarms.clear(event);
                return event.Delete();
            },
            clearAll: function() {
                chrome.alarms.clearAll();
            }
        }
    };
})