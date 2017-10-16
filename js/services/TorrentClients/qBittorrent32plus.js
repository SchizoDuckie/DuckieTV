/** 
 * qBittorrent32plus >= 3.2 client
 *
 * API Docs:
 * https://github.com/qbittorrent/qBittorrent/wiki/WebUI-API-Documentation
 * 
 * - Supports setting download directory (After qBittorrent v3.3.1, using API7+)
 * - Supports setting label (After qBittorrent v3.3.1, using API7+)
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
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Forwarded-Host': window.location.origin
                    }
                }).then(function(result) {
                    if (result.data == "Ok.") {
                        if (window.debug982) console.debug('qBittorrent32plusAPI.login', result.data);
                        return true;
                    } else {
                        if (window.debug982) console.debug('qBittorrent32plusAPI.login', result.data);
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
            addMagnet: function(magnetHash, dlPath, label) {
                var self = this;
                if (self.config.version > 6) {
                    // API7
                    var fd = new FormData();
                    fd.append('urls', magnetHash);
                    if (dlPath !== undefined && dlPath !== null) {
                        fd.append('savepath', dlPath);
                    }
                    if (label !== undefined && label !== null) {
                        fd.append('category', label);
                    }
                    var headers = {
                        'Content-Type': undefined,
                        'X-Forwarded-Host': window.location.origin,
                    };
                    return $http.post(this.getUrl('addmagnet'), fd, {
                        headers: headers
                    }).then(function(result){
                        if (window.debug982) console.debug('qBittorrent32plusAPI.addmagnet', result.data);
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
            addTorrentByUpload: function(data, infoHash, releaseName, dlPath, label) {
                var self = this;
                var headers = {
                    'Content-Type': undefined,
                    'X-Forwarded-Host': window.location.origin,
                };
                var fd = new FormData();
                fd.append('torrents', data, releaseName + '.torrent');

                if (self.config.version > 6) {
                    // API7
                    if (dlPath !== undefined && dlPath !== null) {
                        fd.append('savepath', dlPath);
                    }
                    if (label !== undefined && label !== null) {
                        fd.append('category', label);
                    }
                };

                return $http.post(this.getUrl('addfile'), fd, {
                    transformRequest: angular.identity,
                    headers: headers
                }).then(function(result) {
                    if (window.debug982) console.debug('qBittorrent32plusAPI.addTorrentByUpload', result.data);
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
            /**
             * qBittorrent API7+ supports setting the Download Path when adding magnets and .torrents. 
             */
            isDownloadPathSupported: function() {
                var self = this;
                return (self.config.version > 6);
            },
            /**
             * qBittorrent API7+ supports setting the Label when adding magnets and .torrents. 
             */
            isLabelSupported: function() {
                var self = this;
                return (self.config.version > 6);
            },
            remove: function(magnetHash) {
                return $http.post(this.getUrl('remove'), 'hashes=' + encodeURIComponent(magnetHash), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'X-Forwarded-Host': window.location.origin,
                    }
                });
            },
            execute: function(method, id) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Forwarded-Host': window.location.origin,
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