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
            '1.1.5': ["<li>AutoDownload: (new) Now able to download .torrent files \o/.",
                "<li>Database: (fix) Moved the database management services to the *Background* task, to minimise interruptions to DB writes and maintain integrity.",
                "<li>Favourites: (new) Remembers last used sort selection.",
                "<li>Favourites: (new) Introducing Anime support. Now search uses the absolute episode number when available. Series Settings allows user to select any available Alias to be used in searches instead of the default Title.",
                "<li>SearchEngines: Settings for Jackett! You can use the Jackett proxy to access your favourite open/semi-private/private trackers as DuckieTV Search Engines.",
                "<li>Standalone: (upgrade) nwjs 24.2 chromium 60 Node 8.3.0",
                "<li>TorrentClient: (new) Added BiglyBT client.",
                "<li>TorrentClient: (fix) DuckieTV can now connect with qBitTorrent 3.3.14 (and newer) with CSRF protection.",
                "<li>TorrentClient: (fix) DuckieTV can now connect with Deluge 1.3.14 (and newer) with CSRF protection.",
                "<li>Torrent Dialog [multi-SE]: (new) Remembers last used sort selection.",
                "<li>Trakt-Sync: (fix) DuckieTV now adding a downloaded episode to the user's trakt account collected list.",
                "<li>Trakt-Trending sidepanel: (upgrade) Now using buttons instead of mouse-hover to improve browsing experience.",
                "<li>Misc bug fixes."
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