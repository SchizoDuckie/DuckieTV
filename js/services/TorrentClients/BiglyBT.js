/**
 * BiglyBT has *exactly* the same API as Transmission, so we'll just use that whole implementation and change the config
 * it reads from.
 */
DuckieTorrent.factory('BiglyBT', ["BaseTorrentClient", "TransmissionRemote", "TransmissionAPI",
    function(BaseTorrentClient, TransmissionRemote, TransmissionAPI) {

        var BiglyBT = function() {
            BaseTorrentClient.call(this);
        };
        BiglyBT.extends(BaseTorrentClient, {});

        var service = new BiglyBT();
        service.setName('BiglyBT');
        service.setAPI(new TransmissionAPI());
        service.setRemote(new TransmissionRemote());
        service.setConfigMappings({
            server: 'biglybt.server',
            port: 'biglybt.port',
            path: 'biglybt.path',
            username: 'biglybt.username',
            password: 'biglybt.password',
            use_auth: 'biglybt.use_auth',
            progressX100: 'biglybt.progressX100'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "BiglyBT", "SettingsService",
    function(DuckieTorrent, BiglyBT, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('BiglyBT', BiglyBT);
        }
    }
]);