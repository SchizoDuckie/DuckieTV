DuckieTV.controller("tbtCtrl", ["Transmission", "SettingsService", "$filter",
    function(Transmission, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('transmission.server'),
            port: SettingsService.get('transmission.port'),
            use_auth: SettingsService.get('transmission.use_auth'),
            username: SettingsService.get('transmission.username'),
            password: SettingsService.get('transmission.password')
        };

        this.isConnected = function() {
            return Transmission.isConnected();
        };

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "Transmission " + $filter('translate')('TRANSMISSIONjs/address/lbl'),
                    type: "url",
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('TRANSMISSIONjs/port/lbl'),
                    type: "number",
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: $filter('translate')('TRANSMISSIONjs/authentication/lbl')
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('TRANSMISSIONjs/username/lbl')
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('TRANSMISSIONjs/password/lbl'),
                    type: "password"
                }
            },

        ];

        this.test = function() {
            //console.log("Testing settings");
            Transmission.Disconnect();
            Transmission.setConfig(this.model);
            Transmission.connect().then(function(connected) {
                console.info("Transmission connected! (save settings)", connected);
                Transmission.saveConfig();
            }, function(error) {
                console.error("Transmission connect error!", error);
            });
        };
    }
]);