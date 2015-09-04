DuckieTV.controller("tbtCtrl", ["Transmission", "SettingsService", "FormlyLoader",
    function(Transmission, SettingsService, FormlyLoader) {

        var self = this;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('transmission.server'),
                port: SettingsService.get('transmission.port'),
                use_auth: SettingsService.get('transmission.use_auth'),
                username: SettingsService.get('transmission.username'),
                password: SettingsService.get('transmission.password')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Transmission.isConnected();
        };

        this.test = function() {
            //console.log("Testing settings");
            Transmission.Disconnect();
            Transmission.setConfig(this.model);
            Transmission.connect().then(function(connected) {
                console.info("Transmission connected! (save settings)", connected);
                Transmission.saveConfig();
                //window.location.reload();
            }, function(error) {
                console.error("Transmission connect error!", error);
            });
        };
    }
]);