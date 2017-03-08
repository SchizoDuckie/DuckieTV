DuckieTV.controller("tixatiCtrl", ["$injector", "Tixati", "SettingsService", "FormlyLoader",
    function($injector, Tixati, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('tixati.server'),
                port: SettingsService.get('tixati.port'),
                use_auth: SettingsService.get('tixati.use_auth'),
                username: SettingsService.get('tixati.username'),
                password: SettingsService.get('tixati.password'),
                hideUseAuth: true
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Tixati.isConnected();
        };


        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            Tixati.Disconnect();
            Tixati.setConfig(this.model);
            Tixati.connect().then(function(connected) {
                console.info("Tixati connected! (save settings)", connected);
                self.error = null;
                Tixati.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("Tixati connect error!", error);
            });
        };
    }
]);