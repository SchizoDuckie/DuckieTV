/** 
 * The notification service can create Chrome Notifications to notify users of aired episodes.
 * Currently still needs to be implemented by hooking into the AutoDownloadService
 */
DuckieTV.factory("NotificationService", ["SettingsService", function(SettingsService) {
    var ids = {}; // track existing notifications

    /** 
     * Create a Chrome Notification
     */
    var create = function(options, callback) {
        if (!SettingsService.get('notifications.enabled')) {
            return;
        }
        var id = 'seriesguide_' + new Date().getTime();
        ids[id] = options;
        var notification = chrome.notifications.create(id, options, callback || function() {});
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
            });
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