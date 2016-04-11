DuckieTV.controller("qbt32plusCtrl", ["qBittorrent32plus", "SettingsService", "FormlyLoader",
    function(qBittorrent32plus, SettingsService, FormlyLoader) {

        var self = this;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('qbittorrent32plus.server'),
                port: SettingsService.get('qbittorrent32plus.port'),
                use_auth: SettingsService.get('qbittorrent32plus.use_auth'),
                username: SettingsService.get('qbittorrent32plus.username'),
                password: SettingsService.get('qbittorrent32plus.password'),
                hideUsername: false,
                hideKey: true,
                hideUseAuth: false
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return qBittorrent32plus.isConnected();
        };

        this.test = function() {
            //console.log("Testing settings");
            qBittorrent32plus.Disconnect();
            qBittorrent32plus.setConfig(this.model);
            qBittorrent32plus.connect().then(function(connected) {
                console.info("qBittorrent 3.2+ connected! (save settings)", connected);
                qBittorrent32plus.saveConfig();
            }, function(error) {
                console.error("qBittorrent 3.2+ connect error!", error);
            });
        };

    }
]);