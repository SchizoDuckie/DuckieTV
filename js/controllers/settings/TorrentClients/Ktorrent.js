DuckieTV.controller("ktorrentCtrl", ["$injector", "Ktorrent", "SettingsService", "FormlyLoader",
    function($injector, Ktorrent, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('ktorrent.server'),
                port: SettingsService.get('ktorrent.port'),
                use_auth: SettingsService.get('ktorrent.use_auth'),
                username: SettingsService.get('ktorrent.username'),
                password: SettingsService.get('ktorrent.password'),
                hideUseAuth: true
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Ktorrent.isConnected();
        };


        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            Ktorrent.Disconnect();
            Ktorrent.setConfig(this.model);
            Ktorrent.connect().then(function(connected) {
                console.info("Ktorrent connected! (save settings)", connected);
                self.error = null;
                Ktorrent.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("Ktorrent connect error!", error);
            });
        };
    }
]);