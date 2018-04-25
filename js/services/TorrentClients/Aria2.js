/**
 * Aria2 web client implementation
 *
 * API Docs:
 * https://aria2.github.io/manual/en/html/aria2c.html#rpc-interface
 *
 * JSON-PRC API listens on localhost:6800 by default
 *
 * - supports setting the download directory
 * - Does not support setting or fetching a Label
 */

/**
 *
 * Aria2Data is the main wrapper for a torrent info object coming from Aria2.
 * It extends the base TorrentData class.
 *
 */
Aria2Data = function(data) {
    this.update(data);
};

Aria2Data.extends(TorrentData, {	// https://aria2.github.io/manual/en/html/aria2c.html#aria2.tellStatus
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.round(100 * parseInt(this.completedLength) / parseFloat(this.totalLength), 1);
    },
    getDownloadSpeed: function() {
        return this.downloadSpeed; // Bytes/second
    },
    start: function() {
        return this.getClient().getAPI().execute("unpause", [this.gid]);
    },
    stop: function() {
        return this.getClient().getAPI().execute("pause", [this.gid]);
    },
    pause: function() {
        return this.stop();
    },
    remove: function() {
        var self = this;
        return this.getClient().getAPI().execute("remove", [this.gid]).then(function() {
            return self.getClient().getAPI().getTorrents();
        });
    },
    isStarted: function() {
        return 'active' === this.status;
    },
    getFiles: function() {
        if (!this.files) {
            this.files = [];
        }
        return this.getClient().getAPI().getFiles(this.gid).then(function(data) {
            this.files = data;
            return data;
        }.bind(this));
    },
    getDownloadDir: function() {
        return this.dir;
    }
});


/**
 * Aria2 remote singleton that receives the incoming data
 */
DuckieTorrent.factory('Aria2Remote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var Aria2Remote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = Aria2Data;
        };
        Aria2Remote.extends(BaseTorrentRemote);

        return Aria2Remote;
    }
])


.factory('Aria2API', ['BaseHTTPApi', '$http', '$q',
    function(BaseHTTPApi, $http, $q) {

        var Aria2API = function() {
            BaseHTTPApi.call(this);
        };
        Aria2API.extends(BaseHTTPApi, {
            portscan: function() {
                return this.execute('getVersion').then(function(result) {	// JSON object
                    var enabledFeatures = result && result.enabledFeatures || [];
                    return enabledFeatures.indexOf("BitTorrent") > -1;
                }, function() {
                    return false;
                });
            },

            getTorrents: function() {
                // bah! the tellStatus method only works for one gid, and so
                // we need to make 3 requests to the other tell* methods to list all the torrents :-(
                var torrents = [];
                var token = 'token:' + (this.config.token || '');
                var paramArray = [[
                    {'methodName':'aria2.tellActive',
                     'params': [token]},
                    {'methodName':'aria2.tellWaiting',
                    'params': [token, 0, 9999]},
                    {'methodName':'aria2.tellStopped',
                    'params': [token, 0, 9999]}
                ]];
                return $http.post(this.getUrl('jsonrpc'), {
                    jsonrpc: "2.0",
                    method: "system.multicall",
                    id: "DuckieTV",
                    params: paramArray
                }).then(function(response) {
                    var jsonObject = response && response.data || {};
                    if (jsonObject.result) {
                        jsonObject.result.map(function(tellResults) {
                            tellResults.map(function(torrentList) {
                                torrentList.map(function(torrent) {
                                    if ((torrent.bitfield && "80" !== torrent.bitfield ) && (torrent.status && 'removed' !== torrent.status)) {
                                        // not interested in completed metadata records, or removed torrents
                                        torrents.push(torrent);
                                    }
                                });
                            });
                        });
                    }
                    return torrents.map(function(dl) {
                        dl.hash = dl.infoHash;
                        if (dl.bittorrent && dl.bittorrent.info) {
                            dl.name = dl.bittorrent.info.name ? dl.bittorrent.info.name : dl.infoHash;
                            return dl;
                        }
                        dl.name = dl.files && dl.files.reduce(function(maxSizedFile, file) {
                            return maxSizedFile.length < file.length ? file : maxSizedFile;
                        }, {length: 0}).path;
                        dl.name = dl.name && dl.name.split(/[\\/]/).pop() || ("" + dl.gid);
                        return dl;
                    });
                }, function() {
                    return [];
                });
            },

            getFiles: function(gid) {
                return this.execute('tellStatus', [gid, ["files"]]).then(function(result) {	// JSON object
                    return result && result.files && result.files.map(function(file) {
                        file.name = file.path;
                        return file;
                    }) || [];
                }, function() {
                    return [];
                });
            },

            addMagnet: function(magnet, dlPath) {
                return this.execute('addUri', dlPath ? [[magnet], {dir: dlPath}] : [[magnet]]);
            },

            addTorrentByUrl: function(url, infoHash, releaseName, dlPath) {
                return this.execute('addUri', dlPath ? [[url], {dir: dlPath}] : [[url]]);
            },

            addTorrentByUpload: function(data, infoHash, releaseName, dlPath) {
                var self = this;
                return new PromiseFileReader().readAsDataURL(data).then(function(contents) {
                    var key = "base64,", index = contents.indexOf(key);
                    if (index > -1) {
                        return self.execute('addTorrent', dlPath ? [contents.substring(index + key.length), [], {dir: dlPath}] : [contents.substring(index + key.length)]);
                    }
                });
            },

            isDownloadPathSupported: function() {
                return true;
            },

            execute: function(method, paramArray) {
                paramArray = paramArray || [];
                paramArray.unshift('token:' + (this.config.token || ''));
                return $http.post(this.getUrl('jsonrpc'), {
                    jsonrpc: "2.0",
                    method: "aria2." + method,
                    id: "DuckieTV",
                    params: paramArray
                }).then(function(response) {
                    var jsonObject = response && response.data || {};
                    //console.error(method + ": " + JSON.stringify(jsonObject));
                    return (jsonObject.result) ? jsonObject.result : null;
                }, function() {
                    return false;
                });
            }
        });

        return Aria2API;
    }
])


.factory('Aria2', ['BaseTorrentClient', 'Aria2Remote', 'Aria2API',
    function(BaseTorrentClient, Aria2Remote, Aria2API) {

        var Aria2 = function() {
            BaseTorrentClient.call(this);

        };
        Aria2.extends(BaseTorrentClient);

        var service = new Aria2();

        service.setName('Aria2');
        service.setAPI(new Aria2API());
        service.setRemote(new Aria2Remote());
        service.setConfigMappings({
            server: 'aria2.server',
            port: 'aria2.port',
            token: 'aria2.token'
        });
        service.setEndpoints({
            jsonrpc: '/jsonrpc',
        });
        service.readConfig();

        return service;
    }
])


.run(["DuckieTorrent", "Aria2", "SettingsService",
    function(DuckieTorrent, Aria2, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('Aria2', Aria2);
        }
    }
]);
