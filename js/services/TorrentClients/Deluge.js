/**
 * Deluge web client implementation
 *
 * API Docs:
 * deluge support have updated their docs and the modules section is currently blank :-(
 * https://deluge.readthedocs.org/en/develop/modules/deluge.ui.web.html
 *
 * http://deluge.readthedocs.io/en/develop/index.html
 *
 * - Supports setting download directory
 * - Does not supports setting a label during add.torrent
 */
DelugeData = function(data) {
    this.update(data);
};

DelugeData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.round(this.progress, 1);
    },
    getDownloadSpeed: function() {
        return this.download_payload_rate; // Bytes/second
    },
    start: function() {
        this.getClient().getAPI().execute('core.resume_torrent', [[this.hash]]);
    },
    stop: function() {
        this.getClient().getAPI().execute('core.pause_torrent', [[this.hash]]);
    },
    pause: function() {
        this.stop();
    },
    remove: function() {
        this.getClient().getAPI().execute('core.remove_torrent', [this.hash,false]);
    },
    isStarted: function() {
        return ["Downloading", "Seeding", "Active"].indexOf(this.state) > -1;
    },
    getFiles: function() {
        if (!this.files) {
            this.files = [];
        }
        return this.getClient().getAPI().getFiles(this.hash).then(function(result) {
            this.files = result;
            return result;
        }.bind(this));
    },
    getDownloadDir: function() {
        return this.save_path;
    }
});

DuckieTorrent.factory('DelugeRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var DelugeRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = DelugeData;
        };
        DelugeRemote.extends(BaseTorrentRemote);

        return DelugeRemote;
    }
])

.factory('DelugeAPI', ['BaseHTTPApi', '$http',
    function(BaseHTTPApi, $http) {

        var DelugeAPI = function() {
            BaseHTTPApi.call(this);
            this.requestCounter = 0;
        };
        DelugeAPI.extends(BaseHTTPApi, {

            rpc: function(method, params, options) {
                var self = this,
                    headers = {
                        'Content-Type': 'application/json'
                    },
                    request = {
                        method: method,
                        params: params || [],
                        id: this.requestCounter++
                    };


                return $http.post(this.getUrl('rpc'), request, {headers: headers}).then(function(response) {
                    return response.data;
                }, function(e, f) {
                    throw e;
                });
            },
            portscan: function() {
                var self = this;
                return this.rpc("auth.check_session").then(function(result) {
                    return result !== undefined ? self.rpc("auth.login", [self.config.password]).then(function(response) {
                        //console.debug("Auth result: ", response.result);
                        return response.result;
                    }) : false;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                return this.rpc("web.update_ui", [
                    ["queue", "hash", "name", "total_wanted", "state", "progress", "num_seeds", "total_seeds", "num_peers", "total_peers", "download_payload_rate", "upload_payload_rate", "eta", "ratio", "distributed_copies", "is_auto_managed", "time_added", "tracker_host", "save_path", "total_done", "total_uploaded", "max_download_speed", "max_upload_speed", "seeds_peers_ratio"], {}
                ]).then(function(data) {
                    var output = [];
                    Object.keys(data.result.torrents).map(function(hash) {
                        output.push(data.result.torrents[hash]);
                    });
                    return output;
                });
            },
            getFiles: function(magnetHash) {

                function flattenFiles(object, output) {
                    if (!output) {
                        output = [];
                    }
                    if (object.type == "dir") {
                        Object.keys(object.contents).map(function(key) {
                            return flattenFiles(object.contents[key], output);
                        });
                    } else {
                        if (object.path) {
                            output.push({
                                name: object.path
                            });
                        }
                    }
                    return output;
                }
                return this.rpc("web.get_torrent_files", [magnetHash]).then(function(response) {
                    if (response.result) {
                        return flattenFiles(response.result);
                    } else {
                        return [];
                    }
                });
            },
            addMagnet: function(magnetHash, dlPath) {
                var options = {};
                if (dlPath !== undefined && dlPath !== null) {
                    options = {'download_location': dlPath};
                }
                return this.rpc('web.add_torrents', [
                    [{
                        options: options,
                        path: magnetHash
                    }]
                ]).then(function(response){
                    //console.debug(magnetHash, dlPath, response);
                });
            },
            addTorrentByUpload: function(data, infoHash, releaseName, dlPath) {
                var self = this;
                var headers = {
                    'Content-Type': undefined
                };

                var fd = new FormData();
                fd.append('file', data, releaseName + '.torrent');

                return $http.post(this.getUrl('upload'), fd, {
                    transformRequest: angular.identity,
                    headers: headers
                }).then(function(response) {
                    return this.addMagnet(response.data.files[0], dlPath);
                }.bind(this)).then(function() {
                    return this.getTorrents().then(function(torrents) {
                        return torrents.filter(function(torrent) {
                            return torrent.hash.toUpperCase() == infoHash;
                        })[0].hash;
                    });
                }.bind(this));

            },
            /**
             * Deluge supports setting the Download Path when adding magnets and .torrents. 
             */
            isDownloadPathSupported: function() {
                return true;
            },
            execute: function(method, args) {
                return this.rpc(method, args);
            }
        });

        return DelugeAPI;
    }
])

.factory('Deluge', ["BaseTorrentClient", "DelugeRemote", "DelugeAPI",
    function(BaseTorrentClient, DelugeRemote, DelugeAPI) {

        var Deluge = function() {
            BaseTorrentClient.call(this);
        };
        Deluge.extends(BaseTorrentClient, {});

        var service = new Deluge();
        service.setName('Deluge');
        service.setAPI(new DelugeAPI());
        service.setRemote(new DelugeRemote());
        service.setConfigMappings({
            server: 'deluge.server',
            port: 'deluge.port',
            password: 'deluge.password'
        });
        service.setEndpoints({
            rpc: '/json',
            upload: '/upload'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "Deluge", "SettingsService",
    function(DuckieTorrent, Deluge, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('Deluge', Deluge);
        }
    }
]);
