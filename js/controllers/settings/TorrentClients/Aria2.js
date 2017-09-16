DuckieTV.controller("aria2Ctrl", ["$injector", "Aria2", "SettingsService", "FormlyLoader",
    function($injector, Aria2, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('aria2.server'),
                port: SettingsService.get('aria2.port'),
                token: SettingsService.get('aria2.token')
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return Aria2.isConnected();
        };


        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            Aria2.Disconnect();
            Aria2.setConfig(this.model);
            Aria2.connect().then(function(connected) {
                console.info("Aria2 connected! (save settings)", connected);
                self.error = null;
                Aria2.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("Aria2 connect error!", error);
            });
        };
    }
]);
