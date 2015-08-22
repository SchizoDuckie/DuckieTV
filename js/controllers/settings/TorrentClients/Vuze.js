DuckieTV.controller("vuzeCtrl", ["Vuze", "SettingsService", "$filter",
    function(Vuze, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('vuze.server'),
            port: SettingsService.get('vuze.port'),
            use_auth: SettingsService.get('vuze.use_auth'),
            username: SettingsService.get('vuze.username'),
            password: SettingsService.get('vuze.password')
        };

        this.isConnected = function() {
            return Vuze.isConnected();
        };

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "Vuze " + $filter('translate')('COMMON/address/lbl'),
                    type: "url",
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('COMMON/port/lbl'),
                    type: "number",
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: $filter('translate')('COMMON/authentication/lbl')
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('COMMON/username/lbl')
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('COMMON/password/lbl'),
                    type: "password"
                }
            },

        ];

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