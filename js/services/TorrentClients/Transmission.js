/**
 * Transmission
 */
TransmissionData = function(data) {
    this.update(data);
};

PromiseFileReader = function() {

    this.readAsDataURL = function(blob) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.onerror = function(e) {
                reject(e);
            };
            reader.readAsDataURL(blob);
        });
    };

    return this;
};

TransmissionData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.round(this.percentDone * 100, 1);
    },
    start: function() {
        this.getClient().getAPI().execute('torrent-start', this.id);
    },
    stop: function() {
        this.getClient().getAPI().execute('torrent-stop', this.id);
    },
    pause: function() {
        this.stop();
    },
    isStarted: function() {
        return this.status > 0;
    },
    getFiles: function() {
        var self = this;
        return new Promise(function(resolve) {
            resolve(self.files);
        });
    }
});

DuckieTorrent.factory('TransmissionRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var TransmissionRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = TransmissionData;
        };
        TransmissionRemote.extends(BaseTorrentRemote);

        return TransmissionRemote;
    }
])

.factory('TransmissionAPI', ['BaseHTTPApi', '$http',
    function(BaseHTTPApi, $http) {

        var TransmissionAPI = function() {
            BaseHTTPApi.call(this);
            this.sessionID = null;
        };
        TransmissionAPI.extends(BaseHTTPApi, {

            rpc: function(method, params, options) {
                var self = this,
                    request = {
                        'method': method
                    },
                    headers = {
                        'X-Transmission-Session-Id': self.sessionID
                    };

                for (var i in params) {
                    request[i] = params[i];
                }

                if (this.config.use_auth) {
                    headers.Authorization = 'Basic ' + Base64.encode(this.config.username + ':' + this.config.password);
                }

                return $http.post(this.getUrl('rpc'), request, {
                    headers: headers
                }).then(function(response) {
                    return response.data;
                }, function(e, f) {
                    self.sessionID = e.headers('X-Transmission-Session-Id');
                    if (e.status === 409) {
                        return self.rpc(method, request, options);
                    }
                });
            },
            portscan: function() {
                return this.rpc('session-get').then(function(result) {
                    return result !== undefined;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                return this.rpc('torrent-get', {
                    arguments: {
                        "fields": ["id", "name", "hashString", "status", "error", "errorString", "eta", "isFinished", "isStalled", "leftUntilDone", "metadataPercentComplete", "percentDone", "sizeWhenDone", "files"]
                    }
                }).then(function(data) {
                    return data.arguments.torrents.map(function(el) {
                        el.hash = el.hashString.toUpperCase();
                        return el;
                    });
                });
            },
            addMagnet: function(magnetHash) {
                return this.rpc('torrent-add', {
                    arguments: {
                        paused: false,
                        filename: magnetHash
                    }
                });
            },
            addTorrentByUrl: function(url, releaseName) {
                return this.addMagnet(url).then(function(result) {
                    return result.arguments['torrent-added'].hashString.toUpperCase();
                });
            },
            addTorrentByUpload: function(data, releaseName) {
                var self = this;
                return new PromiseFileReader().readAsDataURL(data).then(function(contents) {
                    var key = "base64,",
                        index = contents.indexOf(key);
                    if (index > -1) {
                        return self.rpc('torrent-add', {
                            arguments: {
                                paused: false,
                                metainfo: contents.substring(index + key.length)
                            }
                        }).then(function(result) {
                            return result.arguments['torrent-added'].hashString.toUpperCase();
                        })
                    }
                });
            },
            execute: function(method, id) {
                return this.rpc(method, {
                    "arguments": {
                        ids: [id]
                    }
                });
            }
        });

        return TransmissionAPI;
    }
])

.factory('Transmission', ["BaseTorrentClient", "TransmissionRemote", "TransmissionAPI",
    function(BaseTorrentClient, TransmissionRemote, TransmissionAPI) {

        var Transmission = function() {
            BaseTorrentClient.call(this);
        };
        Transmission.extends(BaseTorrentClient, {});

        var service = new Transmission();
        service.setName('Transmission');
        service.setAPI(new TransmissionAPI());
        service.setRemote(new TransmissionRemote());
        service.setConfigMappings({
            server: 'transmission.server',
            port: 'transmission.port',
            username: 'transmission.username',
            password: 'transmission.password',
            use_auth: 'transmission.use_auth'
        });
        service.setEndpoints({
            rpc: '/transmission/rpc'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "Transmission", "SettingsService",
    function(DuckieTorrent, Transmission, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('Transmission', Transmission);
        }
    }
]);