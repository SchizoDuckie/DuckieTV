DuckieTorrent

.controller("tixatiCtrl", ["tixati",
    function(tixati) {

        this.connect = function() {
            tixati.AutoConnect();
        }
    }
])

.factory('tixati', ["$q", "$http", "URLBuilder", "$parse", "tixatiRemote",
    function($q, $http, URLBuilder, $parse, tixatiRemote) {
        var self = this;

        this.port = 8888;
        this.base = 'http://127.0.0.1';

        /** 
         * Predefined endpoints for API actions.
         */
        this.endpoints = {

            torrents: '/transfers',
            portscan: '/home',
            infohash: '/transfers/%s/eventlog',
            torrentcontrol: '/transfers/%s/details/action', // POST [start, stop, remove, searchdht, checkfiles, delete] */
            addmagnet: '/transfers/action',
            files: '/transfers/%s/files'
        };

        // will hold a hash of Tixati internal identifiers vs magnet hashes fetched from the events page.
        var infohashCache = {

        };

        /**
         * If a specialized parser is needed for a response than it can be automatically picked up by adding the type and a parser
         * function here.
         */
        this.parsers = {
            portscan: function(result) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(result.data, "text/html");

                categories = {};
                categoriesList = [];
                Array.prototype.map.call(doc.querySelectorAll('.homestats tr:first-child th'), function(node) {
                    categoriesList.push(node.innerText);
                    categories[node.innerText] = {};
                });

                Array.prototype.map.call(doc.querySelectorAll('.homestats tr:not(:first-child)'), function(node) {
                    Array.prototype.map.call(node.querySelectorAll('td'), function(cell, idx) {
                        var cat = cell.innerText.split('  ');
                        categories[categoriesList[idx]][cat[0]] = cat[1];
                    });
                });

                return categories;
            },

            torrents: function(result) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(result.data, "text/html");
                var torrents = [];

                var nameFunc = function() {
                    return this.name;
                }

                var progressFunc = function() {
                    return parseInt(this.progress);
                }

                function sendCommand(formData) {
                    return $http.post(self.getUrl('torrentcontrol', this.guid), formData, {
                        transformRequest: angular.identity,
                        headers: {
                            'Content-Type': undefined
                        }
                    })
                }

                var stopFunc = function(guid) {
                    var fd = new FormData();
                    fd.append('stop', 'Stop');
                    return this.sendCommand(fd);
                }

                var startFunc = function(guid) {
                    var fd = new FormData();
                    fd.append('start', 'Start');
                    return this.sendCommand(fd);
                }

                var startedFunc = function() {
                    return this.status.toLowerCase().indexOf('offline') == -1;
                }

                var filesFunc = function() {
                    this.files = [];
                    request('files', this.guid).then(function(data) {
                        this.files = data;
                    }.bind(this));
                }

                Array.prototype.map.call(doc.querySelectorAll('.xferstable tr:not(:first-child)'), function(node) {
                    var tds = node.querySelectorAll('td');

                    var torrent = {
                        name: tds[1].innerText,
                        bytes: tds[2].innerText,
                        progress: parseInt(tds[3].innerText),
                        status: tds[4].innerText,
                        downSpeed: tds[5].innerText,
                        upSpeed: tds[6].innerText,
                        priority: tds[7].innerText,
                        eta: tds[8].innerText,
                        guid: tds[1].querySelector('a').getAttribute('href').match(/\/transfers\/([a-z-A-Z0-9]+)\/details/)[1],
                        getName: nameFunc,
                        getProgress: progressFunc,
                        start: startFunc,
                        stop: stopFunc,
                        pause: stopFunc,
                        sendCommand: sendCommand,
                        isStarted: startedFunc,
                        getFiles: filesFunc
                    };
                    if ((torrent.guid in infohashCache)) {
                        torrent.hash = infohashCache[torrent.guid];
                        torrents.push(torrent);
                    } else {
                        request('infohash', torrent.guid).then(function(result) {
                            torrent.hash = infohashCache[torrent.guid] = result;
                            torrents.push(torrent);
                        });
                    }
                });
                return torrents;
            },

            infohash: function(result) {
                var magnet = result.data.match(/([0-9ABCDEFabcdef]{40})/);
                if (magnet && magnet.length) {
                    return magnet[0].toUpperCase();
                }
            },

            files: function(result) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(result.data, "text/html");

                var files = [];

                Array.prototype.map.call(doc.querySelectorAll('.xferstable tr:not(:first-child)'), function(node) {
                    var cells = node.querySelectorAll('td')
                    files.push({
                        name: cells[1].innerText.trim(),
                        priority: cells[2].innerText.trim(),
                        bytes: cells[3].innerText.trim(),
                        progress: cells[4].innerText.trim()
                    });
                });

                return files;

            }


        };

        /**
         * Automated parser for responses for usage when neccesary
         */
        this.getParser = function(type) {
            return (type in this.parsers) ? this.parsers[type] : function(data) {
                return data.data;
            };
        };

        /**
         * Fetches the url, auto-replaces the port in the url if it was found.
         */
        this.getUrl = function(type, param) {
            var out = this.base + ':' + this.port + this.endpoints[type];
            return out.replace('%s', encodeURIComponent(param));
        };

        this.isPolling = false;
        this.isConnecting = false;
        this.connected = false;
        this.initialized = false;

        /**
         * Build a JSON request using the URLBuilder service.
         * @param string type url to fetch from the request types
         * @param object params GET parameters
         * @param object options $http optional options
         */
        var request = function(type, params, options) {
            var d = $q.defer();
            params = params || {};
            var url = self.getUrl(type, params)
            var parser = self.getParser(type);
            $http.get(url, {
                data: options,
                headers: [
                    'Authorization: ' + Base64.encode('admin:nimda')
                ]
            }).then(function(response) {
                d.resolve(parser ? parser(response) : response.data);
            }, function(err) {
                console.log('error fetching', type);
                d.reject(err);
            });
            return d.promise;
        };

        var self = this;

        var methods = {

            connect: function() {

                return request('portscan').then(function(result) {
                    console.log("Tixati check result: ", result);
                    self.connected = true;
                    self.isConnecting = false;
                    return true;
                })
            },

            /** 
             * Execute and handle the api's 'update' query.
             * Parses out the events, updates, properties and methods and dispatches them to the TorrentRemote interface
             * for storage, handling and attaching RPC methods.
             */
            statusQuery: function() {
                return request('torrents', {}).then(function(data) {
                        data.map(function(el) {
                            tixatiRemote.handleEvent(el);
                        });
                        return data;
                    },

                    function(error) {
                        console.error("Error executing get status query!", error);
                    });
            },
            /**
             * Return the interface that handles the remote data.
             */
            getRemote: function() {
                return tixatiRemote;
            },

            /**
             * Connect with an auth token obtained by the Pair function.
             * Store the resulting session key in $scope.session
             * You can call this method as often as you want. It'll return a promise that holds
             * off on resolving until the client is connected.
             * If it's connected and initialized, a promise will return that immediately resolves with the remote interface.
             */
            AutoConnect: function() {
                if (!self.isConnecting && !self.connected) {
                    self.connectPromise = $q.defer();
                    self.isConnecting = true;
                } else {
                    return (!self.connected || !self.initialized) ? self.connectPromise.promise : $q(function(resolve) {
                        resolve(methods.getRemote());
                    });
                }

                methods.connect().then(function(result) {
                    console.log("Tixati connected!");
                    if (!self.isPolling) {
                        self.isPolling = true;
                        methods.Update();
                    }
                    self.connectPromise.resolve(methods.getRemote());
                });

                return self.connectPromise.promise;
            },

            togglePolling: function() {
                self.isPolling = !self.isPolling;
                self.Update();
            },
            /**
             * Start the status update polling.
             * Stores the resulting TorrentClient service in $scope.rpc
             * Starts polling every 1s.
             */
            Update: function(dontLoop) {
                if (self.isPolling == true) {
                    methods.statusQuery().then(function(data) {
                        if (undefined === dontLoop && self.isPolling && !data.error) {
                            setTimeout(methods.Update, 3000);
                        }
                    });
                }
            },
            isConnected: function() {
                return self.connected;
            },
            Disconnect: function() {
                self.isPolling = false;
                tixatiRemote.torrents = {};
                tixatiRemote.eventHandlers = {};
            },
            addMagnet: function(magnet) {
                var fd = new FormData();
                fd.append('addlinktext', magnet);
                fd.append('addlink', 'Add');

                return $http.post(self.getUrl('addmagnet'), fd, {
                    transformRequest: angular.identity,
                    headers: {
                        'Content-Type': undefined
                    }
                })
            }
        };
        return methods;
    }
])

/**
 * uTorrent/Bittorrent remote singleton that receives the incoming data
 */
.factory('tixatiRemote', ["$parse", "$rootScope",
    function($parse, $rootScope) {

        var service = {
            torrents: {},
            settings: {},

            getTorrentName: function(torrent) {
                return torrent.name;
            },

            getTorrents: function() {
                var out = [];
                angular.forEach(service.torrents, function(el) {
                    out.push(el);
                });
                return out;
            },

            getByHash: function(hash) {
                hash = hash.toUpperCase();
                return (hash in service.torrents) ? service.torrents[hash] : null;
            },

            handleEvent: function(data) {
                console.log("handle torrent event!", data, data.hash.toUpperCase())
                var key = data.hash.toUpperCase();
                if (!(key in service.torrents)) {
                    service.torrents[key] = data;
                } else {
                    Object.deepMerge(service.torrents[key], data);
                }

                $rootScope.$broadcast('torrent:update:' + key, service.torrents[key]);
            },

            onTorrentUpdate: function(hash, callback) {
                $rootScope.$on('torrent:update:' + hash, function(evt, torrent) {
                    callback(torrent)
                });
            },

            offTorrentUpdate: function(hash, callback) {
                $rootScope.$off('torrent:update:' + hash, function(evt, torrent) {
                    callback(torrent)
                });
            }
        };

        window.qbt = service;
        return service;
    }
])

.run(["DuckieTorrent", "tixati",
    function(DuckieTorrent, tixati) {

        DuckieTorrent.register('tixati', tixati);

    }
])