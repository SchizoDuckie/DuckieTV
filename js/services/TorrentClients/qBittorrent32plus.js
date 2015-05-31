/** 
 * qBittorrent32plus < 3.2 client
 */

DuckieTorrent.factory('qBittorrent32plusAPI', ['qBittorrentAPI', '$http',
    function(qBittorrentAPI, $http) {

        var qBittorrent32plusAPI = function() {
            qBittorrentAPI.call(this);
        };
        qBittorrent32plusAPI.extends(qBittorrentAPI, {
            login: function() {
                return $http.post(this.getUrl('login'), 'username=' + encodeURIComponent(this.config.username) + '&password=' + encodeURIComponent(this.config.password), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function(result) {
                    if (result.data == "Ok.") {
                        return true;
                    } else {
                        throw "Login failed!";
                    }
                });
            },
            portscan: function() {
                var self = this;
                return this.request('version').then(function(result) {
                    console.log("qBittorrent version result: ", result);
                    return self.login().then(function() {
                        return true;
                    });
                }, function() {
                    return false;
                });
            },
            addMagnet: function(magnetHash) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
                return $http.post(this.getUrl('addmagnet'), 'urls=' + encodeURIComponent(magnetHash), {
                    headers: headers
                });
            },
            execute: function(method, id) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
                return $http.post(this.getUrl(method), 'hash=' + id, {
                    headers: headers
                });
            }
        });

        return qBittorrent32plusAPI;
    }
])

.factory('qBittorrent32plus', ["BaseTorrentClient", "qBittorrentRemote", "qBittorrent32plusAPI",
    function(BaseTorrentClient, qBittorrentRemote, qBittorrent32plusAPI) {

        var qBittorrent32plus = function() {
            BaseTorrentClient.call(this);
        };
        qBittorrent32plus.extends(BaseTorrentClient, {});

        var service = new qBittorrent32plus();
        service.setName('qBittorrent 3.2+');
        service.setAPI(new qBittorrent32plusAPI());
        service.setRemote(new qBittorrentRemote());
        service.setConfigMappings({
            server: 'qbittorrent32plus.server',
            port: 'qbittorrent32plus.port',
            username: 'qbittorrent32plus.username',
            password: 'qbittorrent32plus.password',
            use_auth: 'qbittorrent32plus.use_auth'
        });
        service.setEndpoints({
            torrents: '/query/torrents',
            addmagnet: '/command/download',
            resume: '/command/resume',
            pause: '/command/pause',
            files: '/query/propertiesFiles/%s',
            version: '/version/api',
            login: '/login'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "qBittorrent32plus",
    function(DuckieTorrent, qBittorrent32plus) {
        DuckieTorrent.register('qBittorrent 3.2+', qBittorrent32plus);
    }
]);