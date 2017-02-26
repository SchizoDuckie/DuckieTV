DuckieTV.controller("SynologyCtrl", ["SynologyAPI", "SettingsService", "FormlyLoader", "$scope",
    function(SynologyAPI, SettingsService, FormlyLoader, $scope) {

        var self = this;
        this.enabled = SettingsService.get('synology.enabled');

        FormlyLoader.setMapping('protocols', [{
            name: 'http',
        }, {
            name: 'https',
        }]);

        FormlyLoader.load('SynologySettings').then(function(fields) {

            self.model = {
                protocol: SettingsService.get('synology.protocol'),
                ip: SettingsService.get('synology.ip'),
                port: SettingsService.get('synology.port'),
                username: SettingsService.get('synology.username'),
                password: SettingsService.get('synology.password')
            };

            self.fields = fields;
        });

        this.connecting = false;
        this.error = null;

        this.isAuthenticated = function() {
            return SynologyAPI.isAuthenticated();
        };

        this.deAuthorize = function() {
            self.sessionID = null;
            return SynologyAPI.deAuthorize();
        };

        this.sessionID = SynologyAPI.getSessionID();

        this.toggleEnabled = function() {
            this.enabled = !this.enabled;
            SettingsService.set('synology.enabled', this.enabled);
        }

        this.deviceList = null;
        if (this.sessionID !== null) {
            SynologyAPI.init().then(SynologyAPI.DeviceList).then(function(devices) {
                self.deviceList = devices;
            });
        }

        this.test = function() {
            this.connecting = true;
            this.error = false;
            SynologyAPI.setConfig(this.model);
            SynologyAPI.init().then(function(success) {
                console.info("Synology connected! (saving settings)", success);
                SettingsService.set('synology.protocol', self.model.protocol);
                SettingsService.set('synology.ip', self.model.ip);
                SettingsService.set('synology.port', self.model.port);
                SettingsService.set('synology.username', self.model.username);
                SettingsService.set('synology.password', self.model.password);
                self.connecting = false;
                self.connected = true;
                self.error = null;
                self.sessionID = SynologyAPI.getSessionID();
                SynologyAPI.DeviceList().then(function(devices) {
                    self.deviceList = devices;
                });
            }, function(error) {
                self.connecting = false;
                self.connected = false;
                self.error = error.message;
                console.error("Synology connect error!", error);
            });
        };
    }
]);