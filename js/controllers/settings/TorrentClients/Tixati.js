DuckieTV.controller("tixatiCtrl", ["$injector", "Tixati", "SettingsService", "FormlyLoader",
    function($injector, Tixati, SettingsService, FormlyLoader) {

        var self = this;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('tixati.server'),
                port: SettingsService.get('tixati.port'),
                use_auth: SettingsService.get('tixati.use_auth'),
                username: SettingsService.get('tixati.username'),
                password: SettingsService.get('tixati.password'),
                hideUsername: false,
                hideKey: true,
                hideUseAuth: true
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
                $injector.get('DuckietvReload').windowLocationReload();
            }, function(error) {
                console.error("Tixati connect error!", error);
            });
        };
    }
]);