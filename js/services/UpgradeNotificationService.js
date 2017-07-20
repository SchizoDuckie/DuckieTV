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

        var dlgLinks = '<h2>Questions? Suggestions? Bugs? Kudo\'s?</h2>Find DuckieTV on <a href="https://reddit.com/r/DuckieTV" target="_blank">Reddit</a> or <a href="https://facebook.com/DuckieTV/" target="_blank">Facebook</a>.<br>If you find a bug, please report it on <a href="https://github.com/SchizoDuckie/DuckieTV/issues">Github</a></em>';
        var notifications = {
            '1.1.5': ["<li>AutoDownload: (new) Now able to download using .torrent files.",
                "<li>Favourites: (new) Remembers last used sort selection.",
                "<li>qBitTorrent 3.2+ Client: (fix) DuckieTV can now connect with qBitTorrent 3.3.14",
                "<li>SearchEngines: Settings for Jackett! You can now add, as DuckieTV Search engines, any of the public/semi-private/private trackers accessible via the Jackett proxy.",
                "<li>Standalone: (upgrade) nwjs 23.5 chromium 59 Node 8.1.2",
                "<li>Torrent Dialog [multi-SE]: (new) Remembers last used sort selection.",
                "<li>Trakt-Trending sidepanel: (upgrade) Now using buttons instead of mouse-hover to improve browsing experience.",
                "<li>Misc bug fixes"
            ].join('')
        };

        $http.get('VERSION').then(function(data, status, headers, config) {
            var notifyVersion = data.data;
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