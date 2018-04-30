/**
 * tTorrent (Android bitTorrent) https://ttorrent.org/
 *
 * API Docs:
 * none that I could find so far. The WEB UI has been divined by examining the Network traffic
 *
 * - Does not support setting download directory
 * - Does not support setting a Label
 */
tTorrentData = function(data) {
    this.update(data);
};

tTorrentData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.progress;
    },
    getDownloadSpeed: function() {
        return this.downSpeed; // Bytes/second
    },
    start: function() {
        this.getClient().getAPI().execute('start', this.hash);
    },
    pause: function() {
        this.getClient().getAPI().execute('pause', this.hash);
    },
    stop: function() {
        return this.pause();
    },
    remove: function() {
        this.getClient().getAPI().execute('remove', this.hash);
    },
    getFiles: function() {
        return this.getClient().getAPI().getFiles(this.hash).then(function(results) {
            // since files is not supported by tTorrent's webui, lets return the Size and ETA instead.
            results = [{name: ['Files: n/a | TotalSize:', this.size, '| ETA:', this.eta].join(' ')}];
            this.files = results;
            return results;
        }.bind(this));
    },
    getDownloadDir: function() {
        return undefined; // not supported
    },
    isStarted: function() {
        return ["downloading", "seeding"].indexOf(this.status.toLowerCase()) > -1;
    }
});

/** 
 * tTorrent
 */
DuckieTorrent.factory('tTorrentRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var tTorrentRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = tTorrentData;
        };
        tTorrentRemote.extends(BaseTorrentRemote);

        return tTorrentRemote;
    }
])

.factory('tTorrentAPI', ['BaseHTTPApi', '$http', '$q',
    function(BaseHTTPApi, $http, $q) {

        var tTorrentAPI = function() {
            BaseHTTPApi.call(this);
            this.config.token = '';
        };
        tTorrentAPI.extends(BaseHTTPApi, {
            /**
             * Fetches the URL, auto-replaces the port in the URL if it was found.
             */
            getUrl: function(type, param) {
                var out = this.config.server + ':' + this.config.port + this.endpoints[type];
                return (param) ? out.replace('%s', encodeURIComponent(param)) : out;
            },
            portscan: function() {
                var headers = {
                    'Content-Type': 'text/html',
                    'charset': 'utf-8',
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                };
                return this.request('portscan', {headers: headers}).then(function(result) {
                    var scraper = new HTMLScraper(result.data);
                    if (scraper.querySelector('.header').innerText.trim() !== 'tTorrent web interface') {
                        console.warn('webui not found', result);
                        return false;
                    }
                    return true;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() {
                var self = this;
                var headers = {
                    'Content-Type': 'text/html',
                    'charset': 'utf-8',
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                };
                return this.request('torrents', {headers: headers}).then(function(result) {
                    var scraper = new HTMLScraper(result.data);
                    var torrents = [];
                    function convertRate(rateString) {
                        var rate = parseInt(rateString.split(" ")[0]);
                        var units = rateString.split(" ")[1];
                        switch (units) {
                            case 'kB/s': 
                                rate = rate * 1000;
                                break;
                            case 'MB/s': 
                                rate = rate * 1000 * 1000;
                                break;
                            case 'GB/s': 
                                rate = rate * 1000 * 1000 * 1000;
                                break;
                            case 'B/s': 
                                break;
                            default:
                            console.warn('unexpected rate units ', units);
                        };
                        return rate; // Bytes/second
                    };
                    scraper.walkSelector('.torrent', function(torrentNode) {
                        var torrentName = torrentNode.querySelector('.torrentTitle').innerText.trim();
                        // <form action="/cmd/remove/bd5143fcf96b4e11c61c1748f2173a722378fa97" method="post" class="inlineForm">
                        var torrentHash = torrentNode.querySelector('.inlineForm').action.match(/\/cmd\/remove\/([0-9ABCDEFabcdef]{40})/)[1];
                        var torrentDetails = torrentNode.querySelector('.torrentDetails');
                        // <div class="progress" style="width:   0%;">
                        var torrentProgress = parseInt(torrentDetails.querySelector('.progress').style.cssText.split(':')[1].trim(), 10); // 26%
                        // Downloading metadata - 0.0% | Downloading - Paused | Downloading - 25.9% | Seeding - 100.0% | Seeding - Paused | Checking resume data - 0.0%
                        var torrentStatus = torrentDetails.querySelector('div:nth-of-type(2)').innerHTML.replace(/<\/div>/g, '').split('<div>')[0].trim();
                        if (torrentStatus.indexOf('Downloading') > -1 && torrentStatus.indexOf('%') > -1) {
                            // if downloading is active, use this float for better accuracy instead
                            torrentProgress = parseFloat(torrentStatus.replace('Downloading - ', '')); // 25.9%
                        }
                        if (torrentStatus.indexOf('Downloading') == -1 && torrentStatus.indexOf('Seeding') == -1 && torrentStatus.indexOf('Checking') == -1) {
                            console.warn('unexpected status', torrentStatus);
                            torrentStatus = 'Unknown';
                        }
                        if (torrentStatus.indexOf('Downloading - Paused') > -1) { // drop 'Downloading -'
                            torrentStatus = 'Paused';
                        }
                        if (torrentStatus.indexOf('metadata') > -1) { // drop 'Downloading - n.n%'
                            torrentStatus = 'Metadata';
                        }
                        if (torrentStatus.indexOf('resume data') > -1) { // drop 'resume data - n.n%'
                            torrentStatus = 'Checking';
                        }
                        if (torrentStatus.indexOf('Downloading') > -1) { // drop '- n.n%'
                            torrentStatus = 'Downloading';
                        }
                        if (torrentStatus.indexOf('Seeding') > -1) { // drop '- 100.0%'
                            torrentStatus = 'Seeding';
                        }
                        // (downloading) <div>Peers: 105/512 | Ratio: 0.000   Size: 564.4 MB   Uploaded: 0 B | ETA: 4m 55s | Up: 0 B/s   Down: 0 B/s</div>
                        // (seeding) <div>Peers: 9/27 | Ratio: 0.000   Size: 121.4 MB   Uploaded: 0 B | Finished: 5 min. ago | Up: 0 B/s   Down: 0 B/s</div>
                        // one or more fields can be missing!!
                        var torrentData = torrentDetails.querySelector('div:nth-of-type(2)').innerHTML.replace(/<\/div>/g, '').split('<div>')[1].replace(/\|/g, ' ').split('   ');
                        var torrentSize = '0 B';
                        var torrentUpSpeed, torrentDownSpeed = '0 B/s';
                        var torrentETA = 'n/a';
                        torrentData.map(function(data){
                            if (data.indexOf('Size:') > -1) {
                                torrentSize = data.split(':')[1].trim();
                            }
                            if (data.indexOf('ETA:') > -1) {
                                torrentETA = data.split(':')[1].trim();
                            }
                            if (data.indexOf('Finished:') > -1) {
                                torrentETA = 'finished';
                            }
                            if (data.indexOf('Up:') > -1) {
                                torrentUpSpeed = convertRate(data.split(':')[1].trim());
                            }
                            if (data.indexOf('Down:') > -1) {
                                torrentDownSpeed = convertRate(data.split(':')[1].trim());
                            }
                        });
                        
                        var torrent = new tTorrentData({
                            name: torrentName,
                            size: torrentSize,
                            progress: torrentProgress,
                            status: torrentStatus,
                            downSpeed: torrentDownSpeed,
                            upSpeed: torrentUpSpeed,
                            eta: torrentETA,
                            hash: torrentHash
                        });
                        torrents.push(torrent);
                    });
                    return torrents;
                });
            },
            getFiles: function(infoHash) {
                // not available
                return $q.resolve([{}]);
            },
            addMagnet: function(magnetHash) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                }
                return $http.post(this.getUrl('addmagnet'), 'url=' + encodeURIComponent(magnetHash), {
                    headers: headers
                });
            },
            addTorrentByUrl: function(url, infoHash, releaseName) { // UNTESTED
                var self = this;
                return this.addMagnet(url).then(function(result) {
                         
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for tTorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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
            addTorrentByUpload: function(data, infoHash, releaseName) {
                var self = this;
                var headers = {
                    'Content-Type': undefined,
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                }
                var fd = new FormData();
                fd.append('torrentfile', data, releaseName + '.torrent');

                return $http.post(this.getUrl('addfile'), fd, {
                    transformRequest: angular.identity,
                    headers: headers
                }).then(function(result) {
                    var currentTry = 0;
                    var maxTries = 5;
                    // wait for tTorrent to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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
                    'charset': 'utf-8',
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                }
                return $http.post(this.getUrl(method, id), {
                    headers: headers
                }).then(function(response) {
                    console.debug('exec', method,id,response);
                });
            }
        });

        return tTorrentAPI;
    }
])

.factory('tTorrent', ["BaseTorrentClient", "tTorrentRemote", "tTorrentAPI",
    function(BaseTorrentClient, tTorrentRemote, tTorrentAPI) {

        var tTorrent = function() {
            BaseTorrentClient.call(this);
        };
        tTorrent.extends(BaseTorrentClient, {});

        var service = new tTorrent();
        service.setName('tTorrent');
        service.setAPI(new tTorrentAPI());
        service.setRemote(new tTorrentRemote());
        service.setConfigMappings({
            server: 'ttorrent.server',
            port: 'ttorrent.port',
            username: 'ttorrent.username',
            password: 'ttorrent.password',
            use_auth: 'ttorrent.use_auth'
        });
        service.setEndpoints({
            portscan: '/',
            torrents: '/torrents',
            addmagnet: '/cmd/downloadFromUrl',
            addfile: '/cmd/downloadTorrent',
            start: '/cmd/resume/%s',
            pause: '/cmd/pause/%s',
            remove: '/cmd/remove/%s',
        });
        service.readConfig();

        return service;
    }
])

.run(["DuckieTorrent", "tTorrent", "SettingsService",
    function(DuckieTorrent, tTorrent, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('tTorrent', tTorrent);
        }
    }
]);