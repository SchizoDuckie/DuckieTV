/**
 * qBittorrent
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation
 *
 * Works for both 3.2+ and below.
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
                        data.data.downloaddir = general.data.save_path.slice(0, -1);
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
            addTorrentByUrl: function(url, releaseName) {
                var self = this;
                return this.addMagnet(url).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for qBittorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
                    return $q(function(resolve, reject) {
                        /*
                         * find the most likely torrent candidate in the uTorrent host,
                         * based on the .torrent releaseName we just uploaded via the uTorrent WebUi client
                         */
                        function verifyAdded() {
                            // helper function that counts how many words in source are in target
                            function getScore(source, target) {
                                var score = 0;
                                // strip source of non alphabetic characters and duplicate words
                                var sourceArray = source
                                .toUpperCase()
                                .replace(/[^A-Z0-9]+/g, ' ')
                                .trim()
                                .split(' ')
                                .filter(function(item, i, allItems) {
                                    return i == allItems.indexOf(item);
                                });
                                // strip target of non alphabetic characters and duplicate words
                                var targetString = target
                                .toUpperCase()
                                .replace(/[^A-Z0-9]+/g, ' ')
                                .trim()
                                .split(' ')
                                .filter(function(item, i, allItems) {
                                    return i == allItems.indexOf(item)
                                })
                                .join(' ');
                                // count how many words of source are in target
                                sourceArray.map(function(sourceWord) {
                                    if (targetString.indexOf(sourceWord) > -1) {
                                        score++;
                                    }
                                });
                                return score;
                            }

                            currentTry++;
                            self.getTorrents().then(function(result) {
                                var hash = null;
                                var bestScore = 0;
                                // for each torrent compare the torrent.name with .torrent releaseName and record the number of matching words
                                result.map(function(torrent) {
                                    var score = getScore(releaseName, torrent.name);
                                    if (score > bestScore) {
                                        hash = torrent.hash.toUpperCase();
                                        bestScore = score;
                                    }
                                });
                                if (hash !== null) {
                                    resolve(hash);
                                } else {
                                    if (currentTry < maxTries) {
                                        setTimeout(verifyAdded, 1000);
                                    } else {
                                        throw "No hash found for torrent " + releaseName + " in 5 tries.";
                                    }
                                }
                            });
                        }
                        setTimeout(verifyAdded, 1000);
                    });
                }.bind(this));
            },
            addTorrentByUpload: function(data, releaseName) {
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
                        /*
                         * find the most likely torrent candidate in the uTorrent host,
                         * based on the .torrent releaseName we just uploaded via the uTorrent WebUi client
                         */
                        function verifyAdded() {
                            // helper function that counts how many words in source are in target
                            function getScore(source, target) {
                                var score = 0;
                                // strip source of non alphabetic characters and duplicate words
                                var sourceArray = source
                                .toUpperCase()
                                .replace(/[^A-Z0-9]+/g, ' ')
                                .trim()
                                .split(' ')
                                .filter(function(item, i, allItems) {
                                    return i == allItems.indexOf(item);
                                });
                                // strip target of non alphabetic characters and duplicate words
                                var targetString = target
                                .toUpperCase()
                                .replace(/[^A-Z0-9]+/g, ' ')
                                .trim()
                                .split(' ')
                                .filter(function(item, i, allItems) {
                                    return i == allItems.indexOf(item)
                                })
                                .join(' ');
                                // count how many words of source are in target
                                sourceArray.map(function(sourceWord) {
                                    if (targetString.indexOf(sourceWord) > -1) {
                                        score++;
                                    }
                                });
                                return score;
                            }

                            currentTry++;
                            self.getTorrents().then(function(result) {
                                var hash = null;
                                var bestScore = 0;
                                // for each torrent compare the torrent.name with .torrent releaseName and record the number of matching words
                                result.map(function(torrent) {
                                    var score = getScore(releaseName, torrent.name);
                                    if (score > bestScore) {
                                        hash = torrent.hash.toUpperCase();
                                        bestScore = score;
                                    }
                                });
                                if (hash !== null) {
                                    resolve(hash);
                                } else {
                                    if (currentTry < maxTries) {
                                        setTimeout(verifyAdded, 1000);
                                    } else {
                                        throw "No hash found for torrent " + releaseName + " in " + maxTries + " tries.";
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