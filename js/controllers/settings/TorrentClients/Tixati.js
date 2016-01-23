DuckieTV.controller("tixatiCtrl", ["Tixati", "SettingsService", "FormlyLoader",
    function(Tixati, SettingsService, FormlyLoader) {

        var self = this;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('tixati.server'),
                port: SettingsService.get('tixati.port'),
                username: SettingsService.get('tixati.username'),
                password: SettingsService.get('tixati.password'),
                hideUseAuth: true,
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Tixati.isConnected();
        };


        this.test = function() {
            //console.log("Testing settings");
            Tixati.Disconnect();
            Tixati.setConfig(this.model);
            Tixati.connect().then(function(connected) {
                console.info("Tixati connected! (save settings)", connected);
                Tixati.saveConfig();
            }, function(error) {
                console.error("Tixati connect error!", error);
            });
        };
    }
]);