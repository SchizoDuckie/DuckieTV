DuckieTV.controller("qbtCtrl", ["qBittorrent", "SettingsService", "FormlyLoader",
    function(qBittorrent, SettingsService, FormlyLoader) {

        var self = this;

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
            //console.log("Testing settings");
            qBittorrent.Disconnect();
            qBittorrent.setConfig(this.model);
            qBittorrent.connect().then(function(connected) {
                console.info("qBittorrent connected! (save settings)", connected);
                qBittorrent.saveConfig();
                //window.location.reload();
            }, function(error) {
                console.error("qBittorrent connect error!", error);
            });
        };
    }
]);