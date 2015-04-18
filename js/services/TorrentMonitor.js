/**
 * A generic abstraction for adding global event hooks that are executed upon every torrent update
 * Currently used for autoStop. this will be the point to also inject other nifty stuff in the future
 * Like:
 * - Matching incoming torrents names / filenames to existing series/episodes in the database
 * - Mark as downloaded
 */
DuckieTV.factory('TorrentMonitor', ["DuckieTorrent", "SettingsService",
    function(DuckieTorrent, SettingsService) {

        function autoStop(torrent) {
            if (torrent.isStarted() && torrent.getProgress() == 100) {
                console.info('Torrent finished. Auto-stopping', torrent.name);
                torrent.stop();
            }
        };

        function isDownloaded(torrent) {
            if (torrent.getProgress() == 100 && !torrent.downloadMarked) {
                console.info('Torrent finished. marking as downloaded', torrent.name);
                var filter = ['downloaded != 1 and magnetHash = "' + torrent.hash + '"'];
                CRUD.FindOne('Episode', filter).then(function(episode) {
                    torrent.downloadMarked = true;
                    if (!episode) return;
                    episode.markDownloaded();
                    episode.Persist();
                })
            }
        };

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
        if (SettingsService.get('torrenting.enabled') && SettingsService.get('torrenting.autostop')) {
            console.log("Enabling torrent auto-stop!");
            TorrentMonitor.enableAutoStop();
        }
        TorrentMonitor.downloadedHook();
    }
]);