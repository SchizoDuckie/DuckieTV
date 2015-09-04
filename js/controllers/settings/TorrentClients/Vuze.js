DuckieTV.controller("vuzeCtrl", ["Vuze", "SettingsService", "FormlyLoader",
    function(Vuze, SettingsService, FormlyLoader) {

        var self = this;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('vuze.server'),
                port: SettingsService.get('vuze.port'),
                use_auth: SettingsService.get('vuze.use_auth'),
                username: SettingsService.get('vuze.username'),
                password: SettingsService.get('vuze.password')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Vuze.isConnected();
        };


        this.test = function() {
            //console.log("Testing settings");
            Vuze.Disconnect();
            Vuze.setConfig(this.model);
            Vuze.connect().then(function(connected) {
                console.info("Vuze connected! (save settings)", connected);
                Vuze.saveConfig();
                //window.location.reload();
            }, function(error) {
                console.error("Vuze connect error!", error);
            });
        };
    }
]);