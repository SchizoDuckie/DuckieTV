DuckieTorrent

.controller("tbtCtrl", ["Transmission",
    function(Transmission) {

        this.connect = function() {
            Transmission.AutoConnect();
        }
    }
])

.factory('Transmission', ["$q", "$http", "URLBuilder", "$parse", "TransmissionRemote",
    function($q, $http, URLBuilder, $parse, TransmissionRemote) {
        var self = this;

        this.port = 9091;
        this.base = 'http://127.0.0.1';
        this.sessionID = null;

        /** 
         * Predefined endpoints for API actions.
         */
        this.endpoints = {
            rpc: '/transmission/rpc'
        };

        /**
         * If a specialized parser is needed for a response than it can be automatically picked up by adding the type and a parser
         * function here.
         */
        this.parsers = {

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
            var url = this.base + ':' + this.port + this.endpoints[type];
            return url.replace('%s', encodeURIComponent(param));
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
        var rpc = function(method, params, options) {
            var request = {
                'method': method
            };
            for (var i in params) {
                request[i] = params[i];
            }

            function handleError(e, f) {
                if (e.status === 409) {
                    self.sessionID = e.headers('X-Transmission-Session-Id')
                    return rpc(method, request, options);
                }
            }

            return $http.post(self.getUrl('rpc'), request, {
                headers: {
                    'X-Transmission-Session-Id': self.sessionID
                }
            }).then(function(response) {
                return response.data;
            }, handleError);
        };

        var self = this;

        var methods = {

            connect: function() {

                return rpc('session-get').then(function(result) {
                    console.log("Transmission check result: ", result);
                    self.connected = true;
                })
            },

            /** 
             * Execute and handle the api's 'update' query.
             * Parses out the events, updates, properties and methods and dispatches them to the TorrentRemote interface
             * for storage, handling and attaching RPC methods.
             */
            statusQuery: function() {
                return rpc('torrent-get', {
                    arguments: {
                        "fields": ["id", "name", "hashString", "status", "error", "errorString", "eta", "isFinished", "isStalled", "leftUntilDone", "metadataPercentComplete", "percentDone", "sizeWhenDone", "files"]
                    }
                }).then(function(data) {
                        if (!data) throw "No response. Client not active?";
                        data.arguments.torrents.map(function(el) {
                            el.hash = el.hashString.toUpperCase();
                            TransmissionRemote.handleEvent(el);
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
                return TransmissionRemote;
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
                TransmissionRemote.torrents = {};
                TransmissionRemote.eventHandlers = {};
            },

            getFilesList: function(hash) {
                return json('files', hash).then(function(data) {
                    return data;
                });
            },

            addMagnet: function(magnet) {
                return rpc('torrent-add', {
                    "arguments": {
                        "paused": false,
                        "filename": magnet
                    }
                })
            },
            execute: function(method, id) {
                return rpc(method, {
                    "arguments": {
                        ids: [id]
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
.factory('TransmissionRemote', ["$rootScope", "DuckieTorrent",
    function($rootScope, DuckieTorrent) {

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
                return (hash in service.torrents) ? service.torrents[hash] : null;
            },


            handleEvent: function(data) {
                var key = data.hash.toUpperCase();
                if (!(key in service.torrents)) {
                    data.getName = function() {
                        return this.name;
                    };
                    data.getProgress = function() {
                        return Math.round(this.progress * 100);
                    }
                    data.start = function() {
                        DuckieTorrent.getClient().execute('torrent-start', this.id);
                    };

                    data.stop = function() {
                        DuckieTorrent.getClient().execute('torrent-stop', this.id);
                    }
                    data.pause = function() {
                        this.stop();
                    }
                    data.getFiles = function() {

                    }
                    data.isStarted = function() {
                        return this.status > 0;
                    }
                    data.getProgress = function() {
                        return Math.round(this.percentDone * 100);
                    }
                    service.torrents[key] = data;
                } else {
                    Object.keys(data).map(function(property) {
                        service.torrents[key][property] = data[property];
                    })
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

.run(["DuckieTorrent", "Transmission",
    function(DuckieTorrent, Transmission) {

        DuckieTorrent.register('Transmission', Transmission);
        console.log("Transmission registered with DuckieTorrentProvider!");

    }
])