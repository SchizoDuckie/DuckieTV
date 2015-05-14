DuckieTV
/** 
 * A little service that checks localStorage for the upgrade.notify key.
 * If it's not null we fetch the upgrade notification message the notifications key
 * and present it in a dialog if it's available.
 *
 * If the user closes the dialog, the notification is dismissed and not shown again.
 */
.run(["$dialogs", "$http", "$q",
    function($dialogs, $http, $q) {

        var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="http://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="http://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="http://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>';
        var notifications = {
            '1.0': ["<li>Completely revamped user interface (now with 100% more sexyness)",
                "<li>Added support for Tixati, Transmission and qBittorrent torrent clients",
                "<li>Added Strike and RarBG torrent search providers",
                "<li>Added calendar grouping for netflix episode dumps",
                "<li>Initial version of Subtitle search available from episodes panel",
                "<li>Removed Chromecast integration. (Use getvideostream.com and the app!)",
                "<li>Autodownloads now use the configured torrent provider",
                "<li>Revamped the way torrent search engines are created and registered",
                "<li>Shows can be marked as downloaded as well as watched, and downloaded episodes can be highlighted on the calendar",
                "<li>Added Trakt.TV Trending category filters, caching for Trakt.TV trending list",
                "<li>Fixes for DuckieTV standalone: now using frame-less window, open external links in default browser, window and unminimize from tray works in Ubuntu, added upgrade check and notification, and zoom control is now 1:1 with chrome browser",
                "<li>Database performance improvement (including less frequent ratings updates)",
                "<li>Added 'Watch on Netflix' button for Netflix shows - numerous other small changes and bugfixes to list "
            ].join(''),
            '1.0.1': ["<li>Completely revamped user interface (now with 100% more sexyness)",
                "<li>Added support for Tixati, Transmission and qBittorrent torrent clients",
                "<li>Added Strike and RarBG torrent search providers",
                "<li>Added calendar grouping for netflix episode dumps",
                "<li>Initial version of Subtitle search available from episodes panel",
                "<li>Removed Chromecast integration. (Use getvideostream.com and the app!)",
                "<li>Autodownloads now use the configured torrent provider",
                "<li>Revamped the way torrent search engines are created and registered",
                "<li>Shows can be marked as downloaded as well as watched, and downloaded episodes can be highlighted on the calendar",
                "<li>Added Trakt.TV Trending category filters, caching for Trakt.TV trending list",
                "<li>Fixes for DuckieTV standalone: now using frame-less window, open external links in default browser, window and unminimize from tray works in Ubuntu, added upgrade check and notification, and zoom control is now 1:1 with chrome browser",
                "<li>Database performance improvement (including less frequent ratings updates)",
                "<li>Added 'Watch on Netflix' button for Netflix shows - numerous other small changes and bugfixes to list "
            ].join('')
        };

        $http({
            method: 'GET',
            url: 'VERSION'
        }).
        success(function(data, status, headers, config) {
            var notifyVersion = data.trim();
            if (notifyVersion != null && (notifyVersion in notifications) && localStorage.getItem('upgrade.notify') != notifyVersion) {
                var dlg = $dialogs.notify('DuckieTV was upgraded to ' + notifyVersion,
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