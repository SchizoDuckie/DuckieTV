DuckieTV.controller("tTorrentCtrl", ["$injector", "tTorrent", "SettingsService", "FormlyLoader",
    function($injector, tTorrent, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('ttorrent.server'),
                port: SettingsService.get('ttorrent.port'),
                use_auth: SettingsService.get('ttorrent.use_auth'),
                username: SettingsService.get('ttorrent.username'),
                password: SettingsService.get('ttorrent.password'),
                hideUseAuth: false
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return tTorrent.isConnected();
        };

        this.test = function() {
            this.error = false;
            tTorrent.Disconnect();
            tTorrent.setConfig(this.model);
            tTorrent.connect().then(function(connected) {
                console.info("tTorrent  connected! (save settings)", connected);
                self.error = null;
                tTorrent.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("tTorrent  connect error!", error);
            });
        };

    }
]);