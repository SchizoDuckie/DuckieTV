DuckieTV.controller("delugeCtrl", ["Deluge", "SettingsService", "$filter",
    function(Deluge, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('deluge.server'),
            port: SettingsService.get('deluge.port'),
            use_auth: SettingsService.get('deluge.use_auth'),
            password: SettingsService.get('deluge.password')
        };

        this.isConnected = function() {
            return Deluge.isConnected();
        };

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "Deluge " + $filter('translate')('COMMON/address/lbl'),
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
            Deluge.Disconnect();
            Deluge.setConfig(this.model);
            Deluge.connect().then(function(connected) {
                console.info("Deluge connected! (save settings)", connected);
                Deluge.saveConfig();
                window.location.reload();
            }, function(error) {
                console.error("Deluge connect error!", error);
            });
        };
    }
]);