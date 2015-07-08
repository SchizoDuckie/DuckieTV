DuckieTV
/** 
 * A little service that checks localStorage for the upgrade.notify key.
 * If it's not null we fetch the upgrade notification message the notifications key
 * and present it in a dialog if it's available.
 *
 * If the user closes the dialog, the notification is dismissed and not shown again.
 */
.run(["dialogs", "$http", "$q",
    function(dialogs, $http, $q) {

        var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="http://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="http://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="http://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>';
        var notifications = {
            '1.1.2': ["<li>Fixed v1.1.0 and 1.1.1 build that missed important dependencies. sorry for that. :(",
                "<li>Translations: Italian (lamaresh), German (stormfighter), Portuguese (matigonkas)",
                "<li>Created a settings flag to run auto-stop for torrents not initiated by DuckieTV",
                "<li>Added Vuze, uTorrent WEBUI, and fixed qBittorrent 3.2.0 support",
                "<li>Made it possible for all torrent clients to upload and launch torrent files to a remote machine",
                "<li>use mouse-wheel on calendar header to scroll months",
                "<li>Created a settings flag to ignore and hide all ratings (to speed up the daily updates)",
                "<li>Fixes for trakt.tv episode info that's missing important data",
                "<li>Distinguish series that have all episodes marked as watched",
                "<li>Number of unwatched episodes badge over library posters",
                "<li>A start on private tracker integration and allowing users to define custom torrent search engines",
                "<li>Gui improvements, logos, touch-ups, moved menu items to the bottom stuff",
                "<li>hopefully finally fixed time-zone time-travel bugs with air dates",
                "<li>Subtitle settings (configure your languages)",
                "<li>Fixed auto-connect logic when opening torrent client and handling re-authentication",
                "<li>Show next/previous episode when available on series info page",
                "<li>Introduced new transitions for the series-list that should help keeping track of your position when panels resize",
                "<li>standalone option to minimize window to system-tray at start-up",
                "<li>Enable/Disable auto-download for selected series",
                "<li>You can now mark the entire series as watched",
                "<li>Added Genre and Status filters to the library page"
            ].join('')
        };

        $http({
            method: 'GET',
            url: 'VERSION'
        }).
        success(function(data, status, headers, config) {
            var notifyVersion = data.trim();
            if (notifyVersion != null && (notifyVersion in notifications) && localStorage.getItem('upgrade.notify') != notifyVersion) {
                var dlg = dialogs.notify('DuckieTV was upgraded to ' + notifyVersion,
                    "<h2>What's new in this version:</h2>" + notifications[notifyVersion] + dlgLinks, {}, {
                        size: 'lg'
                    });
                dlg.result.then(function() {
                    localStorage.setItem('upgrade.notify', notifyVersion);
                });
            }
        });
    }
]);