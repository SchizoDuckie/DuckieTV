/**
 * A generic abstraction for adding global event hooks that are executed upon every torrent update
 * Currently used for autoStop and mark-downloaded hook. this will be the point to also inject other nifty stuff in the future
 * Like:
 * - Matching incoming torrents names / filenames to existing series/episodes in the database
 */
DuckieTV

    .factory('TorrentMonitor', ["DuckieTorrent", "SettingsService", "TorrentHashListService", "FavoritesService", "NotificationService",
    function(DuckieTorrent, SettingsService, TorrentHashListService, FavoritesService, NotificationService) {

        /**
         * Event that gets called on each torrentdata instance when it updates
         * If the progress is 100%, the torrent is stopped based on:
         * autostop all enabled? always stop the torrent
         * autostop all disabled? stop the torrent only if it was added by DuckieTV.
         */
        function autoStop(torrent) {
            var torrenthash = ('hash' in torrent) ? torrent.hash.toUpperCase() : undefined;
            if (torrent.isStarted() && torrent.getProgress() === 100) {
                // active torrent. do we stop it?
                if (SettingsService.get('torrenting.autostop_all')) {
                    // all torrents  in the torrent-client are allowed to be stopped. Stopping torrent.
                    console.info('Torrent finished. Auto-stopping', torrent.name || torrenthash);
                    torrent.stop();
                } else {
                    // only torrents launched by DuckieTV in the torrent-client are allowed to be stopped                   
                    if (TorrentHashListService.hasHash(torrenthash)) {
                        // this torrent was launched by DuckieTV. Stopping torrent.
                        console.info('Torrent finished. Auto-stopping', torrent.name || torrenthash);
                        torrent.stop();
                    }
                }
            }
        }

        /**
         * A check that runs on each torrentdata update to see if the progress is 100% and the torrent hasn't been marked
         * as downloaded yet.
         * If not marked, updates the database and the torrenthashlist service so that this doesn't have to happen again
         */
        function isDownloaded(torrent) {
            var torrenthash = ('hash' in torrent) ? torrent.hash.toUpperCase() : undefined;
            if (!TorrentHashListService.isDownloaded(torrenthash) && torrent.getProgress() == 100) {
                CRUD.FindOne('Episode', {
                    magnetHash: torrenthash
                }).then(function(episode) {
                    TorrentHashListService.markDownloaded(torrenthash);
                    if (!episode) {
                        NotificationService.notify(
                            "Torrent finished",
                            torrent.name
                        );
                    } else {
                        NotificationService.notify("Torrent finished", [
                            FavoritesService.getByID_Serie(episode.ID_Serie).name,
                            episode.getFormattedEpisode()
                        ].join(" "));
                        episode.markDownloaded().then(function(result) {
                            console.info("Episode marked as downloaded in database. ", episode.ID_Serie, episode.getFormattedEpisode());
                        });
                    }
                });
            }
        }

        var service = {
            enableAutoStop: function() {
                DuckieTorrent.getClient().getRemote().onTorrentUpdate('', autoStop);
            },
            disableAutoStop: function() {
                DuckieTorrent.getClient().getRemote().offTorrentUpdate('', autoStop);
            },
            downloadedHook: function() {
                DuckieTorrent.getClient().getRemote().onTorrentUpdate('', isDownloaded);
            }
        };
        return service;
    }
])


.run(["SettingsService", "TorrentMonitor", "DuckieTorrent",
    function(SettingsService, TorrentMonitor, DuckieTorrent) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.getClient().AutoConnect();
            if (SettingsService.get('torrenting.autostop')) {
                console.info("Enabling torrent auto-stop!");
                TorrentMonitor.enableAutoStop();
            }
            TorrentMonitor.downloadedHook();
        }
    }
]);