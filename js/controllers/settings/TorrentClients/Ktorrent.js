DuckieTV.controller("ktorrentCtrl", ["$injector", "Ktorrent", "SettingsService", "FormlyLoader",
    function($injector, Ktorrent, SettingsService, FormlyLoader) {

        var self = this;

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
            //console.log("Testing settings");
            Ktorrent.Disconnect();
            Ktorrent.setConfig(this.model);
            Ktorrent.connect().then(function(connected) {
                console.info("Ktorrent connected! (save settings)", connected);
                Ktorrent.saveConfig();
                $injector.get('DuckietvReload').windowLocationReload();
            }, function(error) {
                console.error("Ktorrent connect error!", error);
            });
        };
    }
]);