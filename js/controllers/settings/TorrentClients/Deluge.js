DuckieTV.controller("delugeCtrl", ["Deluge", "SettingsService", "FormlyLoader",
    function(Deluge, SettingsService, FormlyLoader) {

        var self = this;

        this.isConnected = function() {
            return Deluge.isConnected();
        };

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('deluge.server'),
                port: SettingsService.get('deluge.port'),
                use_auth: SettingsService.get('deluge.use_auth'),
                password: SettingsService.get('deluge.password'),
                hideUsername: true,
                hideKey: true,
                hideUseAuth: true
            };

            self.fields = fields;
        });

        this.test = function() {
            //console.log("Testing settings");
            Deluge.Disconnect();
            Deluge.setConfig(this.model);
            Deluge.connect().then(function(connected) {
                console.info("Deluge connected! (save settings)", connected);
                Deluge.saveConfig();
            }, function(error) {
                console.error("Deluge connect error!", error);
            });
        };
    }
]);