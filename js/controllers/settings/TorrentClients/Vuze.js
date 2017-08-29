DuckieTV.controller("vuzeCtrl", ["$injector", "Vuze", "SettingsService", "FormlyLoader",
    function($injector, Vuze, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('vuze.server'),
                port: SettingsService.get('vuze.port'),
                path: SettingsService.get('vuze.path'),
                use_auth: SettingsService.get('vuze.use_auth'),
                username: SettingsService.get('vuze.username'),
                password: SettingsService.get('vuze.password'),
                progressX100: SettingsService.get('vuze.progressX100'),
                hidePath: true
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Vuze.isConnected();
        };


        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            Vuze.Disconnect();
            Vuze.setConfig(this.model);
            Vuze.connect().then(function(connected) {
                console.info("Vuze connected! (save settings)", connected);
                self.error = null;
                Vuze.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("Vuze connect error!", error);
            });
        };
    }
]);