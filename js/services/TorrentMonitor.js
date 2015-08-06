/**
 * A generic abstraction for adding global event hooks that are executed upon every torrent update
 * Currently used for autoStop. this will be the point to also inject other nifty stuff in the future
 * Like:
 * - Matching incoming torrents names / filenames to existing series/episodes in the database
 * - Mark as downloaded
 */
DuckieTV

.factory('TorrentMonitor', ["DuckieTorrent", "SettingsService", "TorrentHashListService",
    function(DuckieTorrent, SettingsService, TorrentHashListService) {

        function autoStop(torrent) {
            if (torrent.isStarted() && torrent.getProgress() === 100) {
                // active torrent. do we stop it?
                if (SettingsService.get('torrenting.autostop_all')) {
                    // all torrents  in the torrent-client are allowed to be stopped. Stopping torrent.
                    console.info('Torrent finished. Auto-stopping', torrent.name || torrent.hash);
                    torrent.stop();
                } else {
                    // only torrents launched by DuckieTV in the torrent-client are allowed to be stopped                   
                    if (TorrentHashListService.hasHash(torrent.hash)) {
                        // this torrent was launched by DuckieTV. Stopping torrent.
                        console.info('Torrent finished. Auto-stopping', torrent.name || torrent.hash);
                        TorrentHashListService.markDownloaded(torrent.hash);
                        torrent.stop();
                    }
                }
            }
        }

        function isDownloaded(torrent) {
            if (torrent.getProgress() == 100 && TorrentHashListService.isDownloaded(torrent.hash) === false) {
                console.info('Torrent finished. marking as downloaded', torrent.name || torrent.hash);
                var filter = ['downloaded != 1 and magnetHash = "' + torrent.hash.toUpperCase() + '"'];
                CRUD.FindOne('Episode', filter).then(function(episode) {
                    TorrentHashListService.markDownloaded(torrent.hash);
                    if (!episode) return;
                    episode.markDownloaded();
                    episode.Persist();
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


.run(["SettingsService", "TorrentMonitor",
    function(SettingsService, TorrentMonitor) {
        if (SettingsService.get('torrenting.enabled')) {
            if (SettingsService.get('torrenting.autostop')) {
                console.info("Enabling torrent auto-stop!");
                TorrentMonitor.enableAutoStop();
            }
            TorrentMonitor.downloadedHook();
        }
    }
]);