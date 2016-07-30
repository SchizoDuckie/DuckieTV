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
            '1.1.4': ["<li>autoDownload: (new) use global include / exclude lists, (new) series custom search provider option, (new) option to ignore quality, include and excludes via series custom settings, (new) use global/custom size min/max, (new) use series custom search string, (fix) episodes with date scene names bug, (fix) torrentz seeders count bug, (new) monitor auto-download activity via status sidepanel",
                "<li>fastSearch: (new) introducing the fast-search feature. Just start typing and a dialog pops up with the first six matches of your series from favourites, series from Trakt.TV, and the first 9 matches of episodes from favourites and torrent search.",
                "<li>standalone: (fix) linux minimize bug, (new) option to open add-new-torrent panel on torrentHost, (fix) linux and mac multy systray bug, (fix) defaults for first time users bug",
                "<li>torrentClients: (new) rTorrent client, (new) add remove-torrent functionality to all client Interfaces, (fix) Deluge auto-stop and downloaded bugs, (fix) qBittorrent auto-stop bug, (fix) renamed qBittorrent client to qBittorrent (pre 3.2) for clarity",
                "<li>searchEngines: (fix) remove strike as it is gone, (new) add IsoHunt, (fix) replace showRSS.info with new.showRSS.info, (fix) bug in RarBG causing non-found results after 15 minutes, (fix) drop find random KAT mirror feature as rockaproxy is gone, (new) add 2160p search quality",
                "<li>favorites: (new) sort menu for name, added, first aired and not-watched count, (new) series poster context-menu for mark-all-watched, show/hide from calendar, and remove series",
                "<li>series sidepanel: (new) option to make the episodes-button jump to the first not-watched season, (fix) mark-all-watched did not sync to Trakt.TV, (new) confirm mark-all-watched dialog",
                "<li>season sidepanel: (fix) jump to active season ignores specials unless there is no other seasons, (fix) mark-all-watched did not sync to Trakt.TV, (new) confirm mark-all-watched dialog",
                "<li>episode sidepanel: (fix) overview text not height limited bug",
                "<li>calendar: (fix) events multi-episodes badge incorrectly counted hidden specials bug, (new) Series option to ignore global Hide Specials from calendar, (new) events single click to mark episode as watched",
                "<li>top10: (fix) invalid data handling bug",
                "<li>Subtitles: (fix) net::err_empty_response handling bug",
                "<li>Language: (fix) Russian translations by galeksandrp",
                "<li>TraktTV: (new) Option to change the frequency of the Episode updates.",
                "<li>TorrentDialog: (new) Option to sort the Seeders, Leechers and Size column. (add) Option to enable Sort menu to sort by Age.",
                "<li>Backup: (new) A Backup can now be automatically scheduled. Choose between Never,Daily,Weekly or the default Monthly.",
                "<li>misc bug fixes"
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
