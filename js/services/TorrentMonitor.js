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
            if (torrent.getProgress() == 100) {
                console.info('Torrent finished. Auto-stopping', torrent.name);
                var filter = ['downloaded != 1'];
                filter.magnetHash = torrent.hash,

                CRUD.FindOne('Episode', filter).then(function(episode) {
                    if (!episode) return;
                    episode.downloaded = 1;
                    episode.Persist();
                })
            }
        };

        var service = {

            enableAutoStop: function() {
                DuckieTorrent.getClient().getRemote().onTorrentUpdate(null, autoStop);
            },

            disableAutoStop: function() {
                DuckieTorrent.getClient().getRemote().offTorrentUpdate(null, autoStop);
            },
            downloadedHook: function() {
                DuckieTorrent.getClient().getRemote().onTorrentUpdate(null, isDownloaded);
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
])