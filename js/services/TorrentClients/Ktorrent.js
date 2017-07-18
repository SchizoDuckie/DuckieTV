/**
 * Ktorrent web client implementation
 *
 * API Docs:
 * None. reverse engineered from Ktorrent base implementation webui traffic
 * https://github.com/KDE/ktorrent
 *
 * XMLHTTP API listens on localhost:8080
 *
 * - Does not support setting or fetching the download directory
 * - Does not support setting or fetching a Label
 *
 * torrent data [array of torrent objects] containing:
 *   name: "Angie.Tribeca.S02E01.HDTV.x264-LOL[ettv]"
 *   bytes_downloaded: "19.47 MiB"               *   bytes_uploaded: "0 B"
 *   download_rate: "0 B/s"                      *   info_hash: "494bd308bd6688edb87bcd66a6b676dcd7e0ec30"
 *   leechers: "0"                               *   leechers_total: "6"
 *   num_files: "2"                              *   num_peers: "0"
 *   percentage: "11.83"                         *   running: "0"
 *   seeders: "0"                                *   seeders_total: "52"
 *   status: "Stopped"                           *   total_bytes: "120.22 MiB"
 *   total_bytes_to_download: "120.22 MiB"       *   upload_rate: "0 B/s"
 *
 * files data [array of file objects] containing:
 *   path: "Torrent-Downloaded-from-ExtraTorrent.cc.txt"
 *   percentage: "100.00"        *   priority: "40"      *   size: "168 B"
 */

/**
 *
 * KtorrentData is the main wrapper for a torrent info object coming from Ktorrent.
 * It extends the base TorrentData class.
 *
 */
KtorrentData = function(data) {
    this.update(data);
};

KtorrentData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.round(parseFloat(this.percentage), 1);
    },
    getDownloadSpeed: function() {
        var rate = parseInt(this.download_rate.split(" ")[0]);
        var units = this.download_rate.split(" ")[1];
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
        return rate; // Bytes/second
    },
    start: function() {
        return this.getClient().getAPI().execute("start=" + this.id);
    },
    stop: function() {
        return this.getClient().getAPI().execute("stop=" + this.id);
    },
    pause: function() {
        return this.stop();
    },
    remove: function() {
        var self = this;
        return this.getClient().getAPI().execute("remove=" + this.id).then(function() {
            return self.getClient().getAPI().getTorrents();
        });
    },
    isStarted: function() {
        /*
        * 'downloading', 'stopped', 'not started', 'stalled', 'download completed', 'seeding',
        * 'superseeding', 'allocating diskspace', 'checking data', 'error', 'queued', 'seeding complete'
        */
        return ['stalled','downloading'].indexOf(this.status.toLowerCase()) !== -1;
    },
    getFiles: function() {
        if (!this.files) {
            this.files = [];
        }
        return this.getClient().getAPI().getFiles(this).then(function(data) {
            this.files = data;
            return data;
        }.bind(this));
    },
    getDownloadDir: function() {
        return undefined; // not supported
    }
});


/**
 * Ktorrent remote singleton that receives the incoming data
 */
DuckieTorrent.factory('KtorrentRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var KtorrentRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = KtorrentData;
        };
        KtorrentRemote.extends(BaseTorrentRemote);

        return KtorrentRemote;
    }
])


.factory('KtorrentAPI', ['BaseHTTPApi', '$http', '$q',
    function(BaseHTTPApi, $http, $q) {

        var KtorrentAPI = function() {
            BaseHTTPApi.call(this);
        };
        KtorrentAPI.extends(BaseHTTPApi, {

            login: function(challenge) {
                var sha = hex_sha1(challenge + this.config.password);
                var fd = '&username=' + encodeURIComponent(this.config.username) + '&password=&Login=Sign+in&challenge=' + sha;
                return $http.post(this.getUrl('login'), fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': "application/x-www-form-urlencoded"
                    }
                }).then(function(result) {
                    if (result.statusText == "OK") {
                        return true;
                    } else {
                        throw "Login failed!";
                    }
                });
            },

            portscan: function() {
                var self = this;
                return this.request('portscan').then(function(result) {
                    var x2js = new X2JS();
                    var jsonObj = x2js.xml2json((new DOMParser()).parseFromString(result.data, "text/xml"));
                    return self.login(jsonObj.challenge).then(function() {
                        return true;
                    });
                }, function() {
                    return false;
                });
            },

            getTorrents: function() {
                return this.request('torrents', {}).then(function(result) {
                    var x2js = new X2JS({arrayAccessForm : "property"});
                    var jsonObj = x2js.xml2json((new DOMParser()).parseFromString(result.data, "text/xml"));
                    if ( jsonObj.torrents == "") { // no torrents found
                        return [];
                    } else {
                        return jsonObj.torrents.torrent_asArray.map(function(el, indx) {
                            el.hash = el.info_hash.toUpperCase();
                            el.id = indx;
                            return el;
                        });
                    }
                });
            },

            getFiles: function(torrent) {
                return this.request('files', torrent.id).then(function(result) {
                    var x2js = new X2JS({arrayAccessForm : "property"});
                    var jsonObj = x2js.xml2json((new DOMParser()).parseFromString(result.data, "text/xml"));
                    var files = [];
                    if (jsonObj.torrent == "") { // torrents with a single file don't have a file list?
                        files.push({
                            name: torrent.name,
                            priority: "40",
                            bytes: torrent.total_bytes,
                            progress: torrent.percentage
                        });
                    } else {
                        jsonObj.torrent.file_asArray.map(function(el) {
                            files.push({
                                name: el.path,
                                priority: el.priority,
                                bytes: el.size,
                                progress: el.percentage
                            });
                        });
                    }
                    return files;
                });
            },

            addMagnet: function(magnet) {
                return this.execute("load_torrent=" + encodeURIComponent(magnet));
            },

            addTorrentByUrl: function(url, infoHash, releaseName) {
                var self = this;
                return this.addMagnet(url).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for Ktorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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
                });
            },

            execute: function(cmd) {
                return $http.get(this.getUrl('torrentcontrol') + cmd).then(function(result) {
                    var x2js = new X2JS();
                    var jsonObj = x2js.xml2json((new DOMParser()).parseFromString(result.data, "text/xml"));
                    if (jsonObj.result == "Failed") {
                    console.warn('Error: action "' + cmd + '" failed.');
                    }
                });
            }

        });

        return KtorrentAPI;
    }
])


.factory('Ktorrent', ['BaseTorrentClient', 'KtorrentRemote', 'KtorrentAPI',
    function(BaseTorrentClient, KtorrentRemote, KtorrentAPI) {

        var Ktorrent = function() {
            BaseTorrentClient.call(this);

        };
        Ktorrent.extends(BaseTorrentClient);

        var service = new Ktorrent();

        service.setName('Ktorrent');
        service.setAPI(new KtorrentAPI());
        service.setRemote(new KtorrentRemote());
        service.setConfigMappings({
            server: 'ktorrent.server',
            port: 'ktorrent.port',
            username: 'ktorrent.username',
            password: 'ktorrent.password'
        });
        service.setEndpoints({
            torrents: '/data/torrents.xml',
            login: '/login?page=interface.html',
            portscan: '/login/challenge.xml',
            torrentcontrol: '/action?', // [start=, stop=, remove=, load_torrent=]
            files: '/data/torrent/files.xml?torrent=%s'
        });
        service.readConfig();

        return service;
    }
])


.run(["DuckieTorrent", "Ktorrent", "SettingsService",
    function(DuckieTorrent, Ktorrent, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('Ktorrent', Ktorrent);
        }
    }
]);