/**
 * Ktorrent web client implementation
 *
 * API Docs:
 * None. reverse engineered from Ktorrent base implementation webui traffic
 *
 * XMLHTTP API listens on localhost:8080
 *
 * - Does not support setting or fetching the download directory
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
    }, //done
    getProgress: function() {
        return this.round(parseFloat(this.percentage), 1);
    }, //done
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
    }, //done
    start: function() {
        return this.getClient().getAPI().execute("start=" + this.id);
    }, //done
    stop: function() {
        return this.getClient().getAPI().execute("stop=" + this.id);
    }, //done
    pause: function() {
        return this.stop();
    }, //done
    remove: function() {
        return this.getClient().getAPI().execute("remove=" + this.id);
    }, //done
    isStarted: function() {
        if (['stopped','not started','downloading','stalled', 'download completed'].indexOf(this.status.toLowerCase()) === -1) console.debug(this.status.toLowerCase());
        return this.status.toLowerCase().indexOf('downloading') !== -1;
        // need to check if there are other active states apart from downloading: found so far=['downloading', 'stopped', 'not started', 'stalled', 'download completed']
    }, // nearly
    getFiles: function() {
        if (!this.files) {
            this.files = [];
        }
        return this.getClient().getAPI().getFiles(this).then(function(data) {
            this.files = data;
            return data;
        }.bind(this));
    }, //done
    getDownloadDir: function() {
        return undefined; // not supported
    } //done
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
            }, //done

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
            }, //done

            getTorrents: function() {
                var self = this;
                return this.request('torrents', {}).then(function(result) {
                    var x2js = new X2JS();
                    var jsonObj = x2js.xml2json((new DOMParser()).parseFromString(result.data, "text/xml"));
                    if ( jsonObj.torrents == "") { // no torrents found
                        return [];
                    } else {
                        return jsonObj.torrents.torrent.map(function(el, indx) {
                            el.hash = el.info_hash.toUpperCase();
                            el.id = indx;
                            return el;
                        });
                    }
                });
            }, //done

            getFiles: function(torrent) {
                return this.request('files', torrent.id).then(function(result) {
                    var x2js = new X2JS();
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
                        jsonObj.torrent.file.map(function(el) {
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
            }, //done

            addMagnet: function(magnet) {
                var fd = new FormData();
                fd.append('addlinktext', magnet);
                fd.append('addlink', 'Add');

                return $http.post(this.getUrl('addmagnet'), fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                });
            },

            addTorrentByUpload: function(data, releaseName) {

                var self = this,
                    fd = new FormData();

                fd.append('metafile', data, releaseName + '.torrent');
                fd.append('addmetafile', 'Add');

                return this.request('addmagnet', {}, fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                }).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for Ktorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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

                });
            },

            execute: function(cmd) {
                return $http.get(this.getUrl('torrentcontrol') + cmd);
            } //done

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
            torrents: '/data/torrents.xml', //done
            login: '/login?page=interface.html', //done
            portscan: '/login/challenge.xml', //done
            torrentcontrol: '/action?', // [start=, stop=, remove=] //done
            addmagnet: '/transfers/action',
            files: '/data/torrent/files.xml?torrent=%s' //done
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