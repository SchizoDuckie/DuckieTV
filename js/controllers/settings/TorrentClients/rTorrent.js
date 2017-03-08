DuckieTV.controller("rTorrentCtrl", ["$injector", "rTorrent", "SettingsService", "FormlyLoader",
    function($injector, rTorrent, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('rtorrent.server'),
                port: SettingsService.get('rtorrent.port'),
                path: SettingsService.get('rtorrent.path')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return rTorrent.isConnected();
        };

        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            rTorrent.Disconnect();
            rTorrent.setConfig(this.model);
            rTorrent.connect().then(function(connected) {
                console.info("rTorrent connected! (save settings)", connected);
                self.error = null;
                rTorrent.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("rTorrent connect error!", error);
            });
        };
    }
]);