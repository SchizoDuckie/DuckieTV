/** 
 * The notification service can create Chrome Notifications to notify users of aired episodes.
 */
DuckieTV.factory("NotificationService", ["SettingsService", function(SettingsService) {
    var ids = {}; // track existing notifications

    /** 
     * Create a Chrome Notification
     */
    var create = function(options, callback) {
        if ('chrome' in window && 'notifications' in window.chrome && 'create' in window.chrome.notifications && 'getPermissionLevel' in window.chrome.notifications) {
            if (!SettingsService.get('notifications.enabled')) {
                return;
            }
            window.chrome.notifications.getPermissionLevel( function(level) {
                // User has elected not to show notifications from the app or extension.
                if (level.toLowerCase() == 'denied') {
                    SettingsService.set('notifications.enabled', false);
                    return;
                }
            });
        } else {
            // notifications not supported
            if (SettingsService.get('notifications.enabled')) {
                SettingsService.set('notifications.enabled', false);
            }
            return;
        }
        var id = 'seriesguide_' + new Date().getTime();
        ids[id] = options;
        var notification = window.chrome.notifications.create(id, options, callback || function() {});
    }


    return {
        /** 
         * Create a basic notification with the duckietv icon
         */
        notify: function(title, message, callback) {
            create({
                type: "basic",
                title: title,
                message: message,
                iconUrl: "img/logo/icon64.png"
            }, callback);
        },
        /** 
         * Create a notification of the type 'list' with the DuckieTV icon
         */
        list: function(title, message, items, callback) {
            create({
                type: "list",
                title: title,
                message: message,
                iconUrl: "img/logo/icon64.png",
                items: items
            });
        }

    };

}])