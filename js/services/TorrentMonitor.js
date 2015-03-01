/**
 * A generic abstraction for adding global event hooks that are executed upon every torrent update
 * Currently used for autoStop. this will be the point to also inject other nifty stuff in the future
 * Like:
 * - Matching incoming torrents names / filenames to existing series/episodes in the database
 * - Mark as downloaded
 */
DuckieTV.factory('TorrentMonitor', ["TorrentRemote", "SettingsService",
    function(TorrentRemote, SettingsService) {

        function autoStop(torrent) {
            if (torrent.isStarted() && torrent.getProgress() == 100) {
                console.info('Torrent finished. Auto-stopping', torrent.properties.all.name);
                torrent.stop();
            }
        };

        var service = {

            enableAutoStop: function() {
                TorrentRemote.onTorrentUpdate(null, autoStop);
            },

            disableAutoStop: function() {
                TorrentRemote.offTorrentUpdate(null, autoStop);
            },

            initialize: function() {

                if (SettingsService.get('torrenting.enabled') && SettingsService.get('torrenting.autostop')) {
                    console.log("Enabling torrent auto-stop!");
                    service.enableAutoStop();
                }
            }

        };

        service.initialize();
        return service;
    }
])