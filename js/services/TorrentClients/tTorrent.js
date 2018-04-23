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
    getName: function() { // test ok
        return this.name;
    },
    getProgress: function() { // test ok
        return this.progress;
    },
    getDownloadSpeed: function() { // test ok
        return this.downSpeed; // Bytes/second
    },
    start: function() { // test ok
        this.getClient().getAPI().execute('start', this.hash);
    },
    pause: function() { // test ok
        this.getClient().getAPI().execute('pause', this.hash);
    },
    stop: function() { // test ok
        return this.pause();
    },
    remove: function() { // test ok
        this.getClient().getAPI().execute('remove', this.hash);
    },
    getFiles: function() { // test ok
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
            portscan: function() { // test ok
                var headers = {
                    'Content-Type': 'text/html',
                    'charset': 'utf-8',
                };
                if (this.config.use_auth) {
                    headers.Authorization = [this.config.username, this.config.password];
                };
                return this.request('portscan', {headers: headers}).then(function(result) {
                    var scraper = new HTMLScraper(result.data);
                    /*
                    <div class="header">
                      tTorrent web interface
                      <div class="menu">
                        <form action="/addTorrent" class="inlineForm">
                          <input type="submit" value="Add torrent"/>
                        </form>
                        <form action="/addLink" class="inlineForm">
                          <input type="submit" value="Add link"/>
                        </form>
                      </div>
                      <div class="status" id="status">
                      </div>
                    </div>
                    <div class="torrents" id="content">
                    </div>
                    */
                    if (scraper.querySelector('.header').innerText.trim() !== 'tTorrent web interface') {
                        console.warn('webui not found', result);
                        return false;
                    }
                    return true;
                }, function() {
                    return false;
                });
            },
            getTorrents: function() { // test ok
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
                    /*
                    <div class="torrent">
                      <div class="torrentTitle">Star.Trek.Discovery.S01E03.WEBRip.x264-TBS[ettv]
                      </div>
                      <form action="/cmd/remove/bd5143fcf96b4e11c61c1748f2173a722378fa97" method="post" class="inlineForm">
                        <input type="submit" value="Remove" onclick="return confirm('Are you sure you want to remove this torrent?')" />
                      </form>
                      <form action="/cmd/delete/bd5143fcf96b4e11c61c1748f2173a722378fa97" method="post" class="inlineForm">
                        <input type="submit" value="Delete" onclick="return confirm('Are you sure you want to remove this torrent and delete the downloaded data?')" />
                      </form>
                      <form action="/cmd/pause/bd5143fcf96b4e11c61c1748f2173a722378fa97" method="post" class="inlineForm">
                        <input type="submit" value="Pause" />
                      </form>
                      <div class="torrentDetails">
                        <div class="progress" style="width:  26%;">
                        </div>
                        <div>Downloading - 25.9%
                          <div>Peers: 45/512 | Ratio: 0.000   Size: 311.1 MB   Uploaded: 0 B | ETA: 4m 17s | Up: 5.2 kB/s   Down: 131.3 kB/s
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="torrent">
                      <div class="torrentTitle">Star.Trek.Discovery.S01E04.The.Butchers.Knife.Cares.Not.for.the.Lambs.Cry.540p.CBS.WEB-DL.AAC2.0.x264-AJP69[ettv]
                      </div>
                      <form action="/cmd/remove/2ff148db5b8c8fe0854c5541934a4ddd66848a10" method="post" class="inlineForm">
                        <input type="submit" value="Remove" onclick="return confirm('Are you sure you want to remove this torrent?')" />
                      </form>
                      <form action="/cmd/delete/2ff148db5b8c8fe0854c5541934a4ddd66848a10" method="post" class="inlineForm">
                        <input type="submit" value="Delete" onclick="return confirm('Are you sure you want to remove this torrent and delete the downloaded data?')" />
                      </form>
                      <form action="/cmd/resume/2ff148db5b8c8fe0854c5541934a4ddd66848a10" method="post" class="inlineForm">
                        <input type="submit" value="Resume" />
                      </form>
                      <div class="torrentDetails">
                        <div class="progress" style="width:  19%;"></div>
                        <div>Downloading - Paused
                          <div>Peers: 105/512 | Ratio: 0.000   Size: 564.4 MB   Uploaded: 0 B | ETA: 4m 55s | Up: 0 B/s   Down: 0 B/s
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="torrent">
                      <div class="torrentTitle">Star.Wars.Rebels.S04E02.720p.HDTV.X264-UAV
                      </div>
                      <form action="/cmd/remove/4de65390cc72dd150cfa409aec3b1a47d18c7f64" method="post" class="inlineForm">
                        <input type="submit" value="Remove" onclick="return confirm('Are you sure you want to remove this torrent?')" />
                      </form>
                      <form action="/cmd/delete/4de65390cc72dd150cfa409aec3b1a47d18c7f64" method="post" class="inlineForm">
                        <input type="submit" value="Delete" onclick="return confirm('Are you sure you want to remove this torrent and delete the downloaded data?')" />
                      </form>
                      <form action="/cmd/pause/4de65390cc72dd150cfa409aec3b1a47d18c7f64" method="post" class="inlineForm">
                        <input type="submit" value="Pause" />
                      </form>
                      <div class="torrentDetails">
                        <div class="progress" style="width:   0%;">
                        </div>
                        <div>Downloading metadata - 0.0%
                          <div>Peers: 0/389 | Ratio: 0.000   Size: 0 B   Uploaded: 0 B | Up: 15 B/s   Down: 0 B/s
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="torrent">
                      <div class="torrentTitle">The.Simpsons.S27E10.HDTV.x264-KILLERS[ettv]
                      </div>
                      <form action="/cmd/remove/6349d073f59d22cb581b923b830c6ae52ac9f014" method="post" class="inlineForm"><input type="submit" value="Remove" onclick="return confirm('Are you sure you want to remove this torrent?')" />
                      </form>
                      <form action="/cmd/delete/6349d073f59d22cb581b923b830c6ae52ac9f014" method="post" class="inlineForm"><input type="submit" value="Delete" onclick="return confirm('Are you sure you want to remove this torrent and delete the downloaded data?')" />
                      </form>
                      <form action="/cmd/resume/6349d073f59d22cb581b923b830c6ae52ac9f014" method="post" class="inlineForm"><input type="submit" value="Resume" />
                      </form>
                      <div class="torrentDetails">
                        <div class="progress" style="width: 100%;">
                        </div>
                        <div>Seeding - Paused
                          <div>Peers: 9/27 | Ratio: 0.000   Size: 121.4 MB   Uploaded: 0 B | Finished: 5 min. ago | Up: 0 B/s   Down: 0 B/s
                          </div>
                        </div>
                      </div>
                    </div>
                    */
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
                        // Downloading metadata - 0.0% | Downloading - Paused | Downloading - 25.9% | Seeding - 100.0% | Seeding - Paused
                        var torrentStatus = torrentDetails.querySelector('div:nth-of-type(2)').innerHTML.replace(/<\/div>/g, '').split('<div>')[0].trim();
                        if (torrentStatus.indexOf('Downloading') > -1 && torrentStatus.indexOf('%') > -1) {
                            // if downloading is active, use this float for better accuracy instead
                            torrentProgress = parseFloat(torrentStatus.replace('Downloading - ', '')); // 25.9%
                        }
                        if (torrentStatus.indexOf('Downloading') == -1 && torrentStatus.indexOf('Seeding') == -1) {
                            console.warn('unexpected status', torrentStatus);
                            torrentStatus = 'Unknown';
                        }
                        if (torrentStatus.indexOf('Downloading - Paused') > -1) { // drop 'Downloading -'
                            torrentStatus = 'Paused';
                        }
                        if (torrentStatus.indexOf('metadata') > -1) { // drop 'Downloading - n.n%'
                            torrentStatus = 'Metadata';
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
            getFiles: function(infoHash) { // test ok
                // not available
                return $q.resolve([{}]);
            },
/*
POST /cmd/downloadFromUrl HTTP/1.1
Host: 192.168.1.100:1080
Connection: keep-alive
Content-Length: 388
Cache-Control: max-age=0
Origin: http://192.168.1.100:1080
Upgrade-Insecure-Requests: 1
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,q=0.8
DNT: 1
Referer: http://192.168.1.100:1080/addLink?
Accept-Encoding: gzip, deflate
Accept-Language: en-NZ,en;q=0.9,en-AU;q=0.8

url=magnet%3A%3Fxt%3Durn%3Abtih%3A8d65c530efad946cc719917b5f0e140eee52754f%26dn%3DSouth.Park.S21E08.720p.HDTV.x264-AVS%26tr%3Dudp%253A%252F%252Ftracker.leechers-paradise.org%253A6969%26tr%3Dudp%253A%252F%252Fzer0day.ch%253A1337%26tr%3Dudp%253A%252F%252Fopen.demonii.com%253A1337%26tr%3Dudp%253A%252F%252Ftracker.coppersurfer.tk%253A6969%26tr%3Dudp%253A%252F%252Fexodus.desync.com%253A6969
*/
            addMagnet: function(magnetHash) { // test ok
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
/*
POST /cmd/downloadTorrent HTTP/1.1
Host: 192.168.1.100:1080
Connection: keep-alive
Content-Length: 9692
Cache-Control: max-age=0
Origin: http://192.168.1.100:1080
Upgrade-Insecure-Requests: 1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryxO3IlukUms6tbQmX
User-Agent: Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,q=0.8
DNT: 1
Referer: http://192.168.1.100:1080/addTorrent?
Accept-Encoding: gzip, deflate
Accept-Language: en-NZ,en;q=0.9,en-AU;q=0.8

------WebKitFormBoundaryxO3IlukUms6tbQmX
Content-Disposition: form-data; name="torrentfile"; filename="test.torrent"
Content-Type: application/x-bittorrent
<data>
*/
            addTorrentByUpload: function(data, infoHash, releaseName) { // test ABEND
                if (!this.config.allow_dot_torrent) {
                    console.warn('dot.torrent submissions are disabled', infoHash, releaseName);
                    return false;
                };
                var self = this;
                var headers = {
                    'Content-Type': 'application/x-bittorrent',
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
            execute: function(method, id) { // test ok
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
            use_auth: 'ttorrent.use_auth',
            allow_dot_torrent: 'ttorrent.dot.torrent.enabled'
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