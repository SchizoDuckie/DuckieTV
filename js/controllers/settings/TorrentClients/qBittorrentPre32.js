DuckieTV.controller("qbtCtrl", ["$injector", "qBittorrent", "SettingsService", "FormlyLoader",
    function($injector, qBittorrent, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('qbittorrent.server'),
                port: SettingsService.get('qbittorrent.port'),
                use_auth: SettingsService.get('qbittorrent.use_auth'),
                username: SettingsService.get('qbittorrent.username'),
                password: SettingsService.get('qbittorrent.password')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return qBittorrent.isConnected();
        };

        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            qBittorrent.Disconnect();
            qBittorrent.setConfig(this.model);
            qBittorrent.connect().then(function(connected) {
                console.info("qBittorrent (pre3.2) connected! (save settings)", connected);
                self.error = null;
                qBittorrent.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("qBittorrent {pre3.2) connect error!", error);
            });
        };
    }
]);