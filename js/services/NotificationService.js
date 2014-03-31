angular.module('DuckieTV.providers.notifications', [])


.provider("NotificationService", function() {
    var ids = {};

    var create = function(options, callback) {
        var id = 'seriesguide_' + new Date().getTime();
        ids[id] = options;
        var notification = chrome.notifications.create(id, options, callback || function() {});
    }

    this.$get = function() {
        return {
            notify: function(title, message, callback) {
                create({
                    type: "basic",
                    title: title,
                    message: message,
                    iconUrl: "img/icon-magnet.png"
                });
            },
            list: function(title, message, items, callback) {
                create({
                    type: "list",
                    title: title,
                    message: message,
                    iconUrl: "img/icon-magnet.png",
                    items: items
                });

            }
        }
    };
})