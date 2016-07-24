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
       return this.round(this.bytes_done / this.size_bytes  * 100, 1);
    },
    getDownloadSpeed: function() {
        return this.down_rate; // Bytes/second
    },
    start: function() {
        this.getClient().getAPI().execute('d.start', this.hash);
    },
    stop: function() {
        this.getClient().getAPI().execute('d.stop', this.hash);
    },
    pause: function() {
        this.getClient().getAPI().execute('d.pause', this.hash);
    },
    remove: function() {
        this.getClient().getAPI().execute('d.erase', this.hash);
    },
    isStarted: function() {
        return this.state > 0;
    },
    /**
     * Impossible without parsing the .torrent???
     */
    getFiles: function() {
        var self = this;
        return new Promise(function(resolve) {
            resolve([{name: self.base_filename}]);
        });
    },
    getDownloadDir: function() {
        return this.directory_base;
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
                    pathName: this.config.path, // Default is /rpc2
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
                 
                return xmlrpc.callMethod(method, params).then(function(result) {
                    return result;

                });
                
            },
            portscan: function() {
                return this.rpc('system.api_version').then(function(result) {
                    return result !== undefined;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                var self = this;
                return this.rpc('download_list').then(function(data) {
                    var args = [];
                    var indexMap = {};
                    var props = ["d.get_base_filename", "d.get_base_path", "d.get_bitfield", "d.get_bytes_done", "d.get_chunk_size", "d.get_chunks_hashed", "d.get_complete", "d.get_completed_bytes", "d.get_completed_chunks", "d.get_connection_current", "d.get_connection_leech", "d.get_connection_seed", "d.get_creation_date", "d.get_custom", "d.get_custom1", "d.get_custom2", "d.get_custom3", "d.get_custom4", "d.get_custom5", "d.get_custom_throw", "d.get_directory", "d.get_directory_base", "d.get_down_rate", "d.get_down_total", "d.get_free_diskspace", "d.get_hash", "d.get_hashing", "d.get_hashing_failed", "d.get_ignore_commands", "d.get_left_bytes", "d.get_loaded_file", "d.get_local_id", "d.get_local_id_html", "d.get_max_file_size", "d.get_max_size_pex", "d.get_message", "d.get_mode", "d.get_name", "d.get_peer_exchange", "d.get_peers_accounted", "d.get_peers_complete", "d.get_peers_connected", "d.get_peers_max", "d.get_peers_min", "d.get_peers_not_connected", "d.get_priority", "d.get_priority_str", "d.get_ratio", "d.get_size_bytes", "d.get_size_chunks", "d.get_size_pex", "d.get_skip_rate", "d.get_skip_total", "d.get_state", "d.get_state_changed", "d.get_state_counter", "d.get_throttle_name", "d.get_tied_to_file", "d.get_tracker_focus", "d.get_tracker_numwant", "d.get_tracker_size", "d.get_up_rate", "d.get_up_total", "d.get_uploads_max"];

                    data.map(function(hash) {
                        indexMap[hash] = {};
                        props.map(function(prop) {
                            propTransformer(prop, hash)
                        });
                    })

                    function propTransformer(prop, hash) {
                        var idx = args.push({ "methodName" : prop, "params": [hash]});
                        indexMap[hash][prop] = idx -1;
                    }

                    return self.rpc('system.multicall', [args]).then(function(result) {
                        var output = [];
                        Object.keys(indexMap).map(function(hash) {
                            var torrent = { hash: hash};
                            Object.keys(indexMap[hash]).map(function(property) {
                                torrent[property.replace('d.get_','')] = result[indexMap[hash][property]][0];
                            })
                            output.push(torrent);
                        })
                        return output;
                    })




    /* 

    {"key":"hash","rt":"d.get_hash="},
    {"key":"state","rt":"d.get_state="},
    {"key":"name","rt":"d.get_name="},
    {"key":"size_bytes","rt":"d.get_size_bytes="},
    {"key":"up_total","rt":"d.get_up_total="},
    {"key":"ratio","rt":"d.get_ratio="},
    {"key":"up_rate","rt":"d.get_up_rate="},
    {"key":"down_rate","rt":"d.get_down_rate="},
    {"key":"peers","rt":"d.get_peers_accounted="},
    {"key":"base_path","rt":"d.get_base_path="},
    {"key":"date","rt":"d.get_creation_date="},
    {"key":"active","rt":"d.is_active="},
    {"key":"complete","rt":"d.complete="},
    {"key":"downsize","rt":"d.get_down_total="},
    {"key":"directory","rt":"d.get_directory="},
    {"key":"skipsize","rt":"d.get_skip_total="}

    */

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
                return this.rpc(method, [id]);
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
            server: 'rtorrent.server',
            port: 'rtorrent.port',
            key: 'rtorrent.key',
            path: 'rtorrent.path',
            username: 'rtorrent.username',
            password: 'rtorrent.password',
            use_auth: 'rtorrent.use_auth'
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