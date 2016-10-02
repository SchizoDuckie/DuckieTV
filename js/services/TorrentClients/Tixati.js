/**
 * Tixati web client implementation
 *
 * API Docs:
 * None. reverse engineered from Tixati base implementation
 *      go to settings-->user interface-->webui and turn on the webUI
 *      then at the bottom in the 'HTML Templates' section click 'select a folder' and choose a folder that you want the templates to go into.
 *      then click 'create examples' 
 *      in the folder you selected there should be example templates.
 *
 * HTTP API listens on localhost:8888
 *
 * Setup:
 * Enable web interface in Tixati options, set a username and password.
 * Make sure to use the default skin
 *
 * - Does not support setting or fetching the download directory
 */

/**
 *
 * TixatiData is the main wrapper for a torrent info object coming from Tixati.
 * It extends the base TorrentData class.
 *
 */
TixatiData = function(data) {
    this.update(data);
};

TixatiData.extends(TorrentData, {
    getName: function() {
        return this.name;
    },
    getProgress: function() {
        return this.progress;
    },
    getDownloadSpeed: function() {
        return this.downSpeed; // kB/s (actually governed by Tixati settings: user interface, output formatting, bytes, largest unit. default is k.)
    },
    start: function() {
        var fd = new FormData();
        fd.append('start', 'Start');
        return this.getClient().getAPI().execute(this.guid, fd);
    },
    stop: function() {
        var fd = new FormData();
        fd.append('stop', 'Stop');
        return this.getClient().getAPI().execute(this.guid, fd);
    },
    pause: function() {
        return this.stop();
    },
    remove: function() {
        var self = this;
        var fd = new FormData();
        fd.append('removeconf', 'Remove Transfers');
        fd.append('remove', 'Remove');
        return this.getClient().getAPI().execute(this.guid, fd);
    },
    isStarted: function() {
        return this.status.toLowerCase().indexOf('offline') == -1;
    },
    getFiles: function() {
        if (!this.files) {
            this.files = [];
        }
        return this.getClient().getAPI().getFiles(this.guid).then(function(data) {
            this.files = data;
            return data;
        }.bind(this));
    },
    getDownloadDir: function() {
        return undefined; // not supported
    }
});


/**
 * Tixati remote singleton that receives the incoming data
 */
DuckieTorrent.factory('TixatiRemote', ["BaseTorrentRemote",
    function(BaseTorrentRemote) {

        var TixatiRemote = function() {
            BaseTorrentRemote.call(this);
            this.dataClass = TixatiData;
        };
        TixatiRemote.extends(BaseTorrentRemote);

        return TixatiRemote;
    }
])


.factory('TixatiAPI', ['BaseHTTPApi', '$http', '$q',
    function(BaseHTTPApi, $http, $q) {

        var TixatiAPI = function() {
            this.infohashCache = {};
            BaseHTTPApi.call(this);
        };

        TixatiAPI.extends(BaseHTTPApi, {
            portscan: function() {
                return this.request('portscan').then(function(result) {
                    var scraper = new HTMLScraper(result.data),
                        categories = {},
                        categoriesList = [];

                    scraper.walkSelector('.homestats tr:first-child th', function(node) {
                        categoriesList.push(node.innerText);
                        categories[node.innerText] = {};
                    });

                    scraper.walkSelector('.homestats tr:not(:first-child)', function(node) {
                        scraper.walkNodes(node.querySelectorAll('td'), function(cell, idx) {
                            var cat = cell.innerText.split('  ');
                            categories[categoriesList[idx]][cat[0]] = cat[1];
                        });
                    });

                    return categories;
                });
            },

            getTorrents: function() {
                var self = this;
                return this.request('torrents', {}).then(function(result) {
                    var scraper = new HTMLScraper(result.data);

                    var torrents = [];

                    scraper.walkSelector('.xferstable tr:not(:first-child)', function(node) {
                        var tds = node.querySelectorAll('td');
                        var torrent = new TixatiData({
                            name: tds[1].innerText,
                            bytes: tds[2].innerText,
                            progress: parseInt(tds[3].innerText),
                            status: tds[4].innerText,
                            downSpeed: parseInt(tds[5].innerText == "" ? "0" : tds[5].innerText.replace(',','')) * 1000,
                            upSpeed: parseInt(tds[6].innerText == "" ? "0" : tds[6].innerText.replace(',','')) * 1000,
                            priority: tds[7].innerText,
                            eta: tds[8].innerText,
                            guid: tds[1].querySelector('a').getAttribute('href').match(/\/transfers\/([a-z-A-Z0-9]+)\/details/)[1]
                        });
                        if ((torrent.guid in self.infohashCache)) {
                            torrent.hash = self.infohashCache[torrent.guid];
                            torrents.push(torrent);
                        } else {
                            self.getInfoHash(torrent.guid).then(function(result) {
                                torrent.hash = self.infohashCache[torrent.guid] = result;
                                torrents.push(torrent);
                            });
                        }
                    });
                    return torrents;
                });
            },

            getInfoHash: function(guid) {
                return this.request('infohash', guid).then(function(result) {
                    var magnet = result.data.match(/([0-9ABCDEFabcdef]{40})/);
                    if (magnet && magnet.length) {
                        return magnet[0].toUpperCase();
                    }
                });
            },

            getFiles: function(guid) {
                return this.request('files', guid).then(function(result) {

                    var scraper = new HTMLScraper(result.data);
                    var files = [];

                    scraper.walkSelector('.xferstable tr:not(:first-child)', function(node) {
                        var cells = node.querySelectorAll('td');
                        files.push({
                            name: cells[1].innerText.trim(),
                            priority: cells[2].innerText.trim(),
                            bytes: cells[3].innerText.trim(),
                            progress: cells[4].innerText.trim()
                        });
                    });
                    return files;

                });

            },

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
                    // wait for Tixati to add the torrent to the list. we poll 5 times until we find it, otherwise abort.
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

            execute: function(guid, formData) {
                return $http.post(this.getUrl('torrentcontrol', guid), formData, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                });
            }

        });

        return TixatiAPI;
    }
])


.factory('Tixati', ['BaseTorrentClient', 'TixatiRemote', 'TixatiAPI',
    function(BaseTorrentClient, TixatiRemote, TixatiAPI) {

        var Tixati = function() {
            BaseTorrentClient.call(this);

        };
        Tixati.extends(BaseTorrentClient);

        var service = new Tixati();

        service.setName('Tixati');
        service.setAPI(new TixatiAPI());
        service.setRemote(new TixatiRemote());
        service.setConfigMappings({
            server: 'tixati.server',
            port: 'tixati.port',
            username: 'tixati.username',
            password: 'tixati.password'
        });
        service.setEndpoints({
            torrents: '/transfers',
            portscan: '/home',
            infohash: '/transfers/%s/eventlog',
            torrentcontrol: '/transfers/%s/options/action', // POST [start, stop, remove, searchdht, checkfiles, delete]
            addmagnet: '/transfers/action',
            files: '/transfers/%s/files'
        });
        service.readConfig();

        return service;
    }
])


.run(["DuckieTorrent", "Tixati", "SettingsService",
    function(DuckieTorrent, Tixati, SettingsService) {
        if (SettingsService.get('torrenting.enabled')) {
            DuckieTorrent.register('Tixati', Tixati);
        }
    }
]);