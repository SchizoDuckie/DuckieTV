DuckieTV.controller("qbt32plusCtrl", ["qBittorrent32plus", "SettingsService", "ChromePermissions", "$filter",
    function(qBittorrent32plus, SettingsService, ChromePermissions, $filter) {

        this.model = {
            server: SettingsService.get('qbittorrent32plus.server'),
            port: SettingsService.get('qbittorrent32plus.port'),
            use_auth: SettingsService.get('qbittorrent32plus.use_auth'),
            username: SettingsService.get('qbittorrent32plus.username'),
            password: SettingsService.get('qbittorrent32plus.password')
        };

        this.isConnected = function() {
            return qBittorrent32plus.isConnected();
        };

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "qBittorrent " + $filter('translate')('QBITTORRENT32PLUSjs/address/lbl'),
                    type: "url",
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('QBITTORRENT32PLUSjs/port/lbl'),
                    type: "number",
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: $filter('translate')('QBITTORRENT32PLUSjs/authentication/lbl')
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('QBITTORRENT32PLUSjs/username/lbl')
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('QBITTORRENT32PLUSjs/password/lbl'),
                    type: "password"
                }
            },

        ];

        this.test = function() {
            //console.log("Testing settings");
            qBittorrent32plus.Disconnect();
            qBittorrent32plus.setConfig(this.model);
            qBittorrent32plus.connect().then(function(connected) {
                console.info("qBittorrent 3.2+ connected! (save settings)", connected);
                qBittorrent32plus.saveConfig();
                window.location.reload();
            }, function(error) {
                console.error("qBittorrent 3.2+ connect error!", error);
            });
        };

    }
])