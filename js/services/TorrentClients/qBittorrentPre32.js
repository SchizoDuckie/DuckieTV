/**
 * qBittorrent
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation
 *
 * Works for both 3.2+ and below.
 *
 * - Does not support setting the download directory
 * - Does not support setting the label
 */
qBittorrentData = function(data) {
    this.update(data);
};

qBittorrentData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getDownloadSpeed: function() {
        if (typeof this.dlspeed === 'string') {
            // qBitTorrent < 3.2
            var rate = parseInt(this.dlspeed.split(" ")[0]);
            var units = this.dlspeed.split(" ")[1];
            switch (units) {
                case 'KiB/s': 
                    rate = rate * 1024;
                    break;
                case 'MiB/s': 
                    rate = rate * 1024 * 1024;
                    break;
                case 'GiB/s': 
                    rate = rate * 1024 * 1024 * 1024;
                    break;
                case 'B/s': 
                default:
            };
        } else {
            // qBitTorrent 3.2+
            rate = this.dlspeed;
        };
        return rate; // Bytes/second
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
    remove: function() {
         this.getClient().getAPI().remove(this.hash);
    },
    getFiles: function() {
        var self = this;
        return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
            self.files = results;
            return results;
        });
    },
    getDownloadDir: function() {
        return this.files.downloaddir;
    },
    isStarted: function() {
        return ["downloading", "uploading", "stalledDL", "stalledUP"].indexOf(this.state) > -1;
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
                var self = this;
                return this.request('files', hash).then(function(data) {
                    return self.request('general', hash).then(function(general) {
                        data.data.downloaddir = (general.data.save_path) ? general.data.save_path.slice(0, -1) : undefined;
                        return data.data;
                    });
                });
            },
            addMagnet: function(magnetHash) {
                return $http.post(this.getUrl('addmagnet'), 'urls=' + encodeURIComponent(magnetHash), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });
            },
            remove: function(magnetHash) {
                return $http.post(this.getUrl('remove'), 'hashes=' + encodeURIComponent(magnetHash), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    }
                });
            },
            addTorrentByUrl: function(url, infoHash, releaseName) {
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
                                // for each torrent compare the torrent.hash with .torrent infoHash
                                result.map(function(torrent) {
                                    if (torrent.hash.toUpperCase() == infoHash) {
                                        hash = infoHash;
                                    }
                                });
                                if (hash !== null) {
                                    resolve(hash);
                                } else {
                                    if (currentTry < maxTries) {
                                        setTimeout(verifyAdded, 1000);
                                    } else {
                                        throw "Hash " + infoHash + " not found for torrent " + releaseName + " in " + maxTries + " tries.";
                                    }
                                }
                            });
                        }
                        setTimeout(verifyAdded, 1000);
                    });
                }.bind(this));
            },
            addTorrentByUpload: function(data, infoHash, releaseName) {
                var self = this;
                var headers = {
                    'Content-Type': undefined
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                }
                var fd = new FormData();
                fd.append('torrents', data, releaseName + '.torrent');

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
                                // for each torrent compare the torrent.hash with .torrent infoHash
                                result.map(function(torrent) {
                                    if (torrent.hash.toUpperCase() == infoHash) {
                                        hash = infoHash;
                                    }
                                });
                                if (hash !== null) {
                                    resolve(hash);
                                } else {
                                    if (currentTry < maxTries) {
                                        setTimeout(verifyAdded, 1000);
                                    } else {
                                        throw "Hash " + infoHash + " not found for torrent " + releaseName + " in " + maxTries + " tries.";
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
        service.setName('qBittorrent (pre3.2)');
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
            remove: '/command/delete',
            files: '/json/propertiesFiles/%s',
            general: '/json/propertiesGeneral/%s'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "qBittorrent", "SettingsService",
    function(DuckieTorrent, qBittorrent, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('qBittorrent (pre3.2)', qBittorrent);
        }
    }
]);