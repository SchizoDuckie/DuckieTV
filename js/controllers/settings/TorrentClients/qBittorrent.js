DuckieTV.controller("qbtCtrl", ["qBittorrent", "SettingsService", "$filter",
    function(qBittorrent, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('qbittorrent.server'),
            port: SettingsService.get('qbittorrent.port'),
            use_auth: SettingsService.get('qbittorrent.use_auth'),
            username: SettingsService.get('qbittorrent.username'),
            password: SettingsService.get('qbittorrent.password')
        };

        this.isConnected = function() {
            return qBittorrent.isConnected();
        }

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "qBittorrent " + $filter('translate')('COMMON/address/lbl'),
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
            qBittorrent.Disconnect();
            qBittorrent.setConfig(this.model);
            qBittorrent.connect().then(function(connected) {
                console.info("qBittorrent connected! (save settings)", connected);
                qBittorrent.saveConfig();
                window.location.reload();
            }, function(error) {
                console.error("qBittorrent connect error!", error);
            })
        }
    }
])