/**
 * qBittorrent
 * Works for both 3.2+ and below.
 */
qBittorrentData = function(data) {
    this.update(data);
};

qBittorrentData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.round(this.progress * 100, 1);
    },
    start: function() {
        this.getClient().getAPI().execute('resume', this.hash);
    },
    stop: function() {
        this.pause();
    },
    pause: function() {
        this.getClient().getAPI().execute('pause', this.hash);
    },
    getFiles: function() {
        var self = this;
        return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
            self.files = results;
            return results;
        });
    },
    isStarted: function() {
        return this.status > 0;
    }
});

/** 
 * qBittorrent < 3.2 client
 */
DuckieTorrent.factory('qBittorrentRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var qBittorrentRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = qBittorrentData;
        };
        qBittorrentRemote.extends(BaseTorrentRemote);

        return qBittorrentRemote;
    }
])

.factory('qBittorrentAPI', ['BaseHTTPApi', '$http', '$q',
    function(BaseHTTPApi, $http, $q) {

        var qBittorrentAPI = function() {
            BaseHTTPApi.call(this);
        };
        qBittorrentAPI.extends(BaseHTTPApi, {
            portscan: function() {
                return this.request('portscan').then(function(result) {
                    return result !== undefined;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                return this.request('torrents').then(function(data) {
                    return data.data;
                });
            },
            getFiles: function(hash) {
                return this.request('files', hash).then(function(data) {
                    return data.data;
                });
            },
            addMagnet: function(magnetHash) {
                return $http.post(this.getUrl('addmagnet'), 'urls=' + encodeURIComponent(magnetHash), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });
            },
            addTorrentByUrl: function(url, releaseName) {
                var self = this;
                return this.addMagnet(url).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for qBittorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
                    return $q(function(resolve, reject) {
                        function verifyAdded() {
                            currentTry++;
                            self.getTorrents().then(function(result) {
                                var hash = null;
                                result.map(function(torrent) {
                                    if (torrent.name == releaseName) {
                                        hash = torrent.hash.toUpperCase();
                                    }
                                });
                                if (hash !== null) {
                                    resolve(hash);
                                } else {
                                    if (currentTry < maxTries) {
                                        setTimeout(verifyAdded, 1000);
                                    } else {
                                        throw "No hash foudn for torrent " + releaseName + " in 5 tries.";
                                    }
                                }
                            });
                        }
                        setTimeout(verifyAdded, 1000);
                    });

                }.bind(this));
            },
            addTorrentByUpload: function(data, filename) {
                var self = this;
                var headers = {
                    'Content-Type': undefined
                };
                if (this.config.use_auth) {
                    headers.Authorization = 'Basic ' + Base64.encode(this.config.username + ':' + this.config.password);
                }
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
                return $http.post(this.getUrl(method), 'hash=' + id, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });
            }
        });

        return qBittorrentAPI;
    }
])

.factory('qBittorrent', ["BaseTorrentClient", "qBittorrentRemote", "qBittorrentAPI",
    function(BaseTorrentClient, qBittorrentRemote, qBittorrentAPI) {

        var qBittorrent = function() {
            BaseTorrentClient.call(this);
        };
        qBittorrent.extends(BaseTorrentClient, {});

        var service = new qBittorrent();
        service.setName('qBittorrent');
        service.setAPI(new qBittorrentAPI());
        service.setRemote(new qBittorrentRemote());
        service.setConfigMappings({
            server: 'qbittorrent.server',
            port: 'qbittorrent.port',
            username: 'qbittorrent.username',
            password: 'qbittorrent.password',
            use_auth: 'qbittorrent.use_auth'
        });
        service.setEndpoints({
            torrents: '/json/torrents',
            portscan: '/json/transferInfo',
            addmagnet: '/command/download',
            addfile: '/command/upload',
            resume: '/command/resume',
            pause: '/command/pause',
            files: '/json/propertiesFiles/%s'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "qBittorrent", "SettingsService",
    function(DuckieTorrent, qBittorrent, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('qBittorrent', qBittorrent);
        }
    }
]);