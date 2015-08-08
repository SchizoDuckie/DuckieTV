/** 
 * qBittorrent32plus < 3.2 client
 */

DuckieTorrent.factory('qBittorrent32plusAPI', ['qBittorrentAPI', '$http', '$q',
    function(qBittorrentAPI, $http, $q) {

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
                    console.info("qBittorrent version result: ", result);
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
            addTorrentByUpload: function(data, filename) {
                var self = this;
                var headers = {
                    'Content-Type': undefined
                };
                var fd = new FormData();
                fd.append('torrents', data, filename + '.torrent');

                return $http.post(this.getUrl('addfile'), fd, {
                    transformRequest: angular.identity,
                    headers: headers
                }).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for qBittorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
                    return $q(function(resolve, reject) {
                        function verifyAdded() {
                            currentTry++;
                            self.getTorrents().then(function(result) {
                                var hash = null;
                                result.map(function(torrent) {
                                    if (torrent.name == filename) {
                                        hash = torrent.hash.toUpperCase();
                                    }
                                });
                                if (hash !== null) {
                                    resolve(hash);
                                } else {
                                    if (currentTry < maxTries) {
                                        setTimeout(verifyAdded, 1000);
                                    } else {
                                        throw "No hash foudn for torrent " + filename + " in 5 tries.";
                                    }
                                }
                            });
                        }
                        setTimeout(verifyAdded, 1000);
                    });

                }.bind(this));

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
            addfile: '/command/upload',
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

.run(["DuckieTorrent", "qBittorrent32plus", "SettingsService",
    function(DuckieTorrent, qBittorrent32plus, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('qBittorrent 3.2+', qBittorrent32plus);
        }
    }
]);