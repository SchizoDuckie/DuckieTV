DuckieTV.controller("biglybtCtrl", ["$injector", "BiglyBT", "SettingsService", "FormlyLoader",
    function($injector, BiglyBT, SettingsService, FormlyLoader) {

        var self = this;
        this.error = null;

        FormlyLoader.load('TorrentClientSettings').then(function(fields) {

            self.model = {
                server: SettingsService.get('biglybt.server'),
                port: SettingsService.get('biglybt.port'),
                path: SettingsService.get('biglybt.path'),
                use_auth: SettingsService.get('biglybt.use_auth'),
                username: SettingsService.get('biglybt.username'),
                password: SettingsService.get('biglybt.password'),
                progressX100: SettingsService.get('biglybt.progressX100'),
                hidePath: true
            };

            self.fields = fields;
        });

        this.isConnected = function() {
            return BiglyBT.isConnected();
        };


        this.test = function() {
            this.error = false;
            //console.log("Testing settings");
            BiglyBT.Disconnect();
            BiglyBT.setConfig(this.model);
            BiglyBT.connect().then(function(connected) {
                console.info("BiglyBT connected! (save settings)", connected);
                self.error = null;
                BiglyBT.saveConfig();
                window.location.reload();
            }, function(error) {
                self.error = error;
                console.error("BiglyBT connect error!", error);
            });
        };
    }
]);