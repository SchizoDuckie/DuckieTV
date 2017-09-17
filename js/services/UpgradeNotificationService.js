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
            '1.1.5': ["<li>AutoDownload: (new) Now able to download .torrent files \\o/.",
                "<li>Database: (fix) Moved the database management services to the *Background* task, to minimise interruptions to DB updates and maintain integrity.",
                "<li>Favourites: (new) Remembers last used sort selection.",
                "<li>Favourites: (new) Introducing Anime support. Now a search can use the absolute episode number when available. Series Settings allows the user to select any available Alias to replace the default Title in searches.",
                "<li>SearchEngines: (new) Introducing Jackett! You can use the Jackett proxy to access your favourite open/semi-private/private trackers as DuckieTV Search Engines.",
                "<li>SearchEngines: (removed) IsoHunt.to is gone.",
                "<li>Standalone: (upgrade) NWJS 25.0 with Chromium 61 and Node 8.4.0",
                "<li>TorrentClient: (new) Introducing Aria2 client.",
                "<li>TorrentClient: (new) Introducing BiglyBT client.",
                "<li>TorrentClient: (fix) Can now connect with qBitTorrent 3.3.14 (and newer) with CSRF protection.",
                "<li>TorrentClient: (fix) Can now connect with Deluge 1.3.14 (and newer) with CSRF protection.",
                "<li>Torrent Dialog [multi-SE]: (new) Remembers last used sort selection.",
                "<li>Trakt-Sync: (upgrade) When an episode is marked as downloaded it is added to the collected list of a user's Trakt account.",
                "<li>Trakt-Trending sidepanel: (upgrade) Now using buttons instead of mouse-hover to improve browsing experience.",
                "<li>Misc: Bug fixes."
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