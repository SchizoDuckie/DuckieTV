DuckieTV.controller("uTorrentWebUICtrl", ["uTorrentWebUI", "SettingsService", "$filter",
    function(uTorrentWebUI, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('utorrentwebui.server'),
            port: SettingsService.get('utorrentwebui.port'),
            use_auth: SettingsService.get('utorrentwebui.use_auth'),
            username: SettingsService.get('utorrentwebui.username'),
            password: SettingsService.get('utorrentwebui.password')
        };

        this.isConnected = function() {
            return uTorrentWebUI.isConnected();
        };

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "uTorrent Web UI " + $filter('translate')('UTORRENTWEBUIjs/address/lbl'),
                    type: "url",
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('UTORRENTWEBUIjs/port/lbl'),
                    type: "number",
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: $filter('translate')('UTORRENTWEBUIjs/authentication/lbl')
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('UTORRENTWEBUIjs/username/lbl')
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('UTORRENTWEBUIjs/password/lbl'),
                    type: "password"
                }
            },

        ];

        this.test = function() {
            //console.log("Testing settings");
            uTorrentWebUI.Disconnect();
            uTorrentWebUI.setConfig(this.model);
            uTorrentWebUI.connect().then(function(connected) {
                console.info("uTorrent WEBUI connected! (save settings)", connected);
                uTorrentWebUI.saveConfig();
            }, function(error) {
                console.error("uTorrent WEBUI connect error!", error);
            });
        };

    }
]);