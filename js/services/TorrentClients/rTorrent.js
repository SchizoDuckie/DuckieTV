/**
 * rTorrent
 *
 * API Docs:
 * https://github.com/rakshasa/rtorrent/wiki/RPC-Setup-XMLRPC
 */
rTorrentData = function(data) {
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

rTorrentData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        var unit = (this.getClient().getAPI().isSeedBox()) ? 1 : 100;
        return this.round(this.percentDone * unit, 1);
    },
    getDownloadSpeed: function() {
        return this.rateDownload; // Bytes/second
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
    remove: function() {
        this.getClient().getAPI().execute('torrent-remove', this.id);
    },
    isStarted: function() {
        return this.status > 0;
    },
    getFiles: function() {
        var self = this;
        return new Promise(function(resolve) {
            resolve(self.files);
        });
    },
    getDownloadDir: function() {
        return this.downloadDir;
    }
});

DuckieTorrent.factory('rTorrentRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var rTorrentRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = rTorrentData;
        };
        rTorrentRemote.extends(BaseTorrentRemote);

        return rTorrentRemote;
    }
])

.factory('rTorrentAPI', ['BaseHTTPApi', 'xmlrpc',
    function(BaseHTTPApi, xmlrpc) {

        var rTorrentAPI = function() {
            BaseHTTPApi.call(this);
            this.sessionID = null;
        };
        rTorrentAPI.extends(BaseHTTPApi, {

            
            rpc: function(method, params, options) {
                  xmlrpc.config({
                    hostName: this.config.server+':'+this.config.port, // Default is empty
                    pathName: "/RPC2", // Default is /rpc2
                    401: function() {
                        console.warn("You shall not pass !");
                    },
                    404: function() {
                        console.info("API not found");
                    },
                    500: function() {
                        console.error("Something went wrong :(");
                    }
                });
                  debugger;

                return xmlrpc.callMethod(method, params).then(function(result) {
                    console.log("xmlrpc result: " , result);
                    return result;

                });
                
            },
            portscan: function() {
                return this.rpc('system.listMethods').then(function(result) {
                    console.log("yay!", result);
                    //debugger;
                    return result !== undefined;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                return this.rpc('torrent-get', {
                    arguments: {
                        "fields": ["id", "name", "hashString", "status", "error", "errorString", "eta", "isFinished", "isStalled", "leftUntilDone", "metadataPercentComplete", "percentDone", "sizeWhenDone", "files", "rateDownload", "rateUpload", "downloadDir"]
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
            isSeedBox: function() {
                return (this.config.key !== '/rTorrent/rpc');
            },
            execute: function(method, id) {
                return this.rpc(method, {
                    "arguments": {
                        ids: [id]
                    }
                });
            }
        });

        return rTorrentAPI;
    }
])

.factory('rTorrent', ["BaseTorrentClient", "rTorrentRemote", "rTorrentAPI",
    function(BaseTorrentClient, rTorrentRemote, rTorrentAPI) {

        var rTorrent = function() {
            BaseTorrentClient.call(this);
        };
        rTorrent.extends(BaseTorrentClient, {});

        var service = new rTorrent();
        service.setName('rTorrent');
        service.setAPI(new rTorrentAPI());
        service.setRemote(new rTorrentRemote());
        service.setConfigMappings({
            server: 'rTorrent.server',
            port: 'rTorrent.port',
            key: 'rTorrent.key',
            username: 'rTorrent.username',
            password: 'rTorrent.password',
            use_auth: 'rTorrent.use_auth'
        });
        service.setEndpoints({
            rpc: 'this is replaced by config.key'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "rTorrent", "SettingsService",
    function(DuckieTorrent, rTorrent, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('rTorrent', rTorrent);
        }
    }
]);