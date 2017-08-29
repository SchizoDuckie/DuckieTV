DuckieTV.controller("tbtCtrl", ["$injector", "Transmission", "SettingsService", "FormlyLoader",
    function($injector, Transmission, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('transmission.server'),
                port: SettingsService.get('transmission.port'),
                path: SettingsService.get('transmission.path'),
                use_auth: SettingsService.get('transmission.use_auth'),
                username: SettingsService.get('transmission.username'),
                password: SettingsService.get('transmission.password'),
                progressX100: SettingsService.get('transmission.progressX100')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Transmission.isConnected();
        };

        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            Transmission.Disconnect();
            Transmission.setConfig(this.model);
            Transmission.connect().then(function(connected) {
                console.info("Transmission connected! (save settings)", connected);
                self.error = null;
                Transmission.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("Transmission connect error!", error);
            });
        };
    }
]);