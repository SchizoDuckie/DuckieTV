DuckieTV.controller("qbt32plusCtrl", ["$injector", "qBittorrent32plus", "SettingsService", "FormlyLoader",
    function($injector, qBittorrent32plus, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('qbittorrent32plus.server'),
                port: SettingsService.get('qbittorrent32plus.port'),
                use_auth: SettingsService.get('qbittorrent32plus.use_auth'),
                username: SettingsService.get('qbittorrent32plus.username'),
                password: SettingsService.get('qbittorrent32plus.password')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return qBittorrent32plus.isConnected();
        };

        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            qBittorrent32plus.Disconnect();
            qBittorrent32plus.setConfig(this.model);
            qBittorrent32plus.connect().then(function(connected) {
                console.info("qBittorrent 3.2+ connected! (save settings)", connected);
                self.error = null;
                qBittorrent32plus.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("qBittorrent 3.2+ connect error!", error);
            });
        };

    }
]);