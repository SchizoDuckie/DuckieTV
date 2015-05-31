/**
 * qBittorrent
 * Works for both 3.2+ and below.
 */
qBittorrentData = function(data) {
    this.update(data);
};

qBittorrentData.extends(TorrentData, {
    getName: function() {
        return this.name;
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
    getFiles: function() {
        return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
            this.files = results;
        }.bind(this));
    },
    isStarted: function() {
        return this.status > 0;
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

.factory('qBittorrentAPI', ['BaseHTTPApi', '$http',
    function(BaseHTTPApi, $http) {

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
                return this.request('files', hash).then(function(data) {
                    return data;
                });
            },
            addMagnet: function(magnetHash) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
                if (this.config.use_auth) {
                    headers.Authorization = 'Basic ' + Base64.encode(this.config.username + ':' + this.config.password);
                }
                return $http.post(this.getUrl('addmagnet'), 'urls=' + encodeURIComponent(magnetHash), {
                    headers: headers
                });
            },
            execute: function(method, id) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
                if (this.config.use_auth) {
                    headers.Authorization = 'Basic ' + Base64.encode(this.config.username + ':' + this.config.password);
                }
                return $http.post(this.getUrl(method), 'hash=' + id, {
                    headers: headers
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
        service.setName('qBittorrent');
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
            resume: '/command/resume',
            pause: '/command/pause',
            files: '/json/propertiesFiles/%s'
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "qBittorrent",
    function(DuckieTorrent, qBittorrent) {
        DuckieTorrent.register('qBittorrent', qBittorrent);
    }
]);