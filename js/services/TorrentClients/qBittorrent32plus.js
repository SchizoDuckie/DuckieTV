/** 
 * qBittorrent32plus >= 3.2 client
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation
 * 
 * - Supports setting download directory (After qBittorrent v3.3.1, using API7)
 */

DuckieTorrent.factory('qBittorrent32plusAPI', ['qBittorrentAPI', '$http', '$q',
    function(qBittorrentAPI, $http, $q) {

        var qBittorrent32plusAPI = function() {
            qBittorrentAPI.call(this);
            this.config.version = 0; // API version
        };
        qBittorrent32plusAPI.extends(qBittorrentAPI, {
            version: null,
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
                    self.config.version = result.data;
                    return self.login().then(function() {
                        return true;
                    });
                }, function() {
                    return false;
                });
            },
            addMagnet: function(magnetHash, dlPath) {
                var self = this;
                if (self.config.version > 6) {
                    // API7
                    var fd = new FormData();
                    fd.append('urls', magnetHash);
                    if (dlPath !== undefined && dlPath !== null) {
                        fd.append('savepath', dlPath);
                    }
                    var headers = {
                        'Content-Type': undefined,
                    };
                    return $http.post(this.getUrl('addmagnet'), fd, {
                        headers: headers
                    });                    
                } else {
                    // API6
                    var headers = {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    };
                    return $http.post(this.getUrl('addmagnet'), 'urls=' + encodeURIComponent(magnetHash), {
                        headers: headers
                    });
                }
            },
            addTorrentByUpload: function(data, releaseName) {
                var self = this;
                var headers = {
                    'Content-Type': undefined
                };
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
            /**
             * qBittorrent API7+ supports setting the Download Path when adding magnets and .torrents. 
             */
            isDownloadPathSupported: function() {
                var self = this;
                return (self.config.version > 6);
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
            remove: '/command/delete',
            files: '/query/propertiesFiles/%s',
            general: '/query/propertiesGeneral/%s',
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