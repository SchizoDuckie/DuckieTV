/**
 * uTorrentWebUI
 *
 * API Docs:
 * https://forum.utorrent.com/topic/21814-web-ui-api/
 * https://github.com/bittorrent/webui/blob/master/webui.js
 *
 * - Does not support setting download directory
 * - you can add sub directories to the default download directory by appending
 *   '&download_dir=0,&path=' + encodeURIComponent(subdir)
 *   or select a predefined path and using &download_dir=n (where n is the index to the path table :-( )
 * - Does not support setting a Label during add.torrent
 */
uTorrentWebUIData = function(data) {
    this.update(data);
};

uTorrentWebUIData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.round(this.progress / 10, 1);
    },
    getDownloadSpeed: function() {
        return this.download_speed; // Bytes/second
    },
    start: function() {
        this.getClient().getAPI().execute('start', this.hash);
    },
    stop: function() {
        this.getClient().getAPI().execute('stop', this.hash);
    },
    pause: function() {
        this.getClient().getAPI().execute('pause', this.hash);
    },
    remove: function() {
        this.getClient().getAPI().execute('remove', this.hash);
    },
    getFiles: function() {
        return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
            this.files = results;
            return results;
        }.bind(this));
    },
    getDownloadDir: function() {
        return this.download_dir;
    },
    isStarted: function() {
        return this.status % 2 === 1;
    }
});

/** 
 * uTorrentWebUI
 */
DuckieTorrent.factory('uTorrentWebUIRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var uTorrentWebUIRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = uTorrentWebUIData;
        };
        uTorrentWebUIRemote.extends(BaseTorrentRemote);

        return uTorrentWebUIRemote;
    }
])

.factory('uTorrentWebUIAPI', ['BaseHTTPApi', '$http', '$q',
    function(BaseHTTPApi, $http, $q) {

        var uTorrentWebUIAPI = function() {
            BaseHTTPApi.call(this);
            this.config.token = '';
        };
        uTorrentWebUIAPI.extends(BaseHTTPApi, {
            /**
             * Fetches the URL, auto-replaces the port in the URL if it was found.
             */
            getUrl: function(type, param) {
                var out = this.config.server + ':' + this.config.port + this.endpoints[type];
                if (out.indexOf('%token%') > -1) {
                    out = out.replace('%token%', this.config.token);
                }
                return (param) ? out.replace('%s', encodeURIComponent(param)) : out;
            },
            portscan: function() {
                var self = this;
                return this.request('portscan').then(function(result) {
                    if (result !== undefined) {
                        var token = new HTMLScraper(result.data).querySelector('#token').innerHTML;
                        if (token) {
                            self.config.token = token;
                        }
                        return true;
                    }
                    return false;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                var self = this;
                return this.request('torrents').then(function(data) {
                    return data.data.torrents.map(function(torrent) {
                        return {
                            hash: torrent[0],
                            status: torrent[1],
                            name: torrent[2],
                            size: torrent[3],
                            progress: torrent[4],
                            downloaded: torrent[5],
                            uploaded: torrent[6],
                            ratio: torrent[7],
                            upload_speed: torrent[8],
                            download_speed: torrent[9],
                            eta: torrent[10],
                            label: torrent[11],
                            peers_connected: torrent[12],
                            peers_in_swarm: torrent[13],
                            seeds_connected: torrent[14],
                            seeds_in_swarm: torrent[15],
                            availability: torrent[16],
                            torrent_queue_order: torrent[17],
                            remaining: torrent[18],
                            download_url: torrent[19],
                            rss_feed_url: torrent[20],
                            status_message: torrent[21],
                            stream_id: torrent[22],
                            added_on: torrent[23],
                            completed_on: torrent[24],
                            app_update_url: torrent[25],
                            download_dir: torrent[26]
                        };
                    });
                }, function(e, f) {
                    if (e.status === 400) {
                        console.warn('uTorrentWebUI returned', e.data.trim(), e.statusText,  e.status, 'during getTorrents. Going to retry.');
                        self.portscan(); // get Token just in case it expired
                        return self.getTorrents(); // retry
                    }
                });
            },
            getFiles: function(hash) {
                return this.request('files', hash).then(function(data) {
                    //debugger;
                    if ('files' in data.data) {
                        return data.data.files[1].map(function(file) {
                            return {
                                name: file[0],
                                filesize: file[1],
                                downloaded: file[2],
                                priority: file[3],
                                firstpiece: file[4],
                                num_pieces: file[5],
                                streamable: file[6],
                                encoded_rate: file[7],
                                duration: file[8],
                                width: file[9],
                                height: file[10],
                                stream_eta: file[11],
                                streamability: file[12]
                            };
                        });
                    } else {
                        return [];
                    };
                });
            },
            addMagnet: function(magnetHash) {
                var headers = {
                    'Content-Type': undefined
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                }
                var fd = new FormData();
                fd.append('s', magnetHash);
                return $http.post(this.getUrl('addmagnet'), fd, {
                    headers: headers
                });
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
                fd.append('torrent_file', data, releaseName + '.torrent');

                return $http.post(this.getUrl('addfile'), fd, {
                    transformRequest: angular.identity,
                    headers: headers
                }).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for uTorrent WebUi to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                }
                return $http.post(this.getUrl(method, id), {
                    headers: headers
                });
            }
        });

        return uTorrentWebUIAPI;
    }
])

.factory('uTorrentWebUI', ["BaseTorrentClient", "uTorrentWebUIRemote", "uTorrentWebUIAPI",
    function(BaseTorrentClient, uTorrentWebUIRemote, uTorrentWebUIAPI) {

        var uTorrentWebUI = function() {
            BaseTorrentClient.call(this);
        };
        uTorrentWebUI.extends(BaseTorrentClient, {});

        var service = new uTorrentWebUI();
        service.setName('uTorrent Web UI');
        service.setAPI(new uTorrentWebUIAPI());
        service.setRemote(new uTorrentWebUIRemote());
        service.setConfigMappings({
            server: 'utorrentwebui.server',
            port: 'utorrentwebui.port',
            username: 'utorrentwebui.username',
            password: 'utorrentwebui.password',
            use_auth: 'utorrentwebui.use_auth'
        });
        service.setEndpoints({
            portscan: '/gui/token.html',
            torrents: '/gui/?token=%token%&list=1',
            addmagnet: '/gui/?token=%token%&action=add-url',
            addfile: '/gui/?token=%token%&action=add-file&download_dir=0&path=',
            stop: '/gui/?token=%token%&action=stop&hash=%s',
            start: '/gui/?token=%token%&action=start&hash=%s',
            pause: '/gui/?token=%token%&action=pause&hash=%s',
            remove: '/gui/?token=%token%&action=remove&hash=%s',
            files: '/gui/?token=%token%&action=getfiles&hash=%s',
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "uTorrentWebUI", "SettingsService",
    function(DuckieTorrent, uTorrentWebUI, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('uTorrent Web UI', uTorrentWebUI);
        }
    }
]);