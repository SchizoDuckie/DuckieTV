DuckieTV.controller("tixatiCtrl", ["Tixati", "SettingsService", "$filter",
    function(Tixati, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('tixati.server'),
            port: SettingsService.get('tixati.port'),
            username: SettingsService.get('tixati.username'),
            password: SettingsService.get('tixati.password'),
        };

        this.fields = [{
            key: "server",
            type: "input",
            templateOptions: {
                label: "Tixati " + $filter('translate')('TIXATIjs/address/lbl'),
                type: "url",
            }
        }, {
            key: "port",
            type: "input",
            templateOptions: {
                label: $filter('translate')('TIXATIjs/port/lbl'),
                type: "number",
            }
        }, {
            key: "username",
            type: "input",
            templateOptions: {
                label: $filter('translate')('TIXATIjs/username/lbl')
            }
        }, {
            key: "password",
            type: "input",
            templateOptions: {
                label: $filter('translate')('TIXATIjs/password/lbl'),
                type: "password"
            }
        }, ];

        this.isConnected = function() {
            return Tixati.isConnected();
        };


        this.test = function() {
            //console.log("Testing settings");
            Tixati.Disconnect();
            Tixati.setConfig(this.model);
            Tixati.connect().then(function(connected) {
                console.info("Tixati connected! (save settings)", connected);
                Tixati.saveConfig();
                window.location.reload();
            }, function(error) {
                console.error("Tixati connect error!", error);
            });
        };
    }
]);