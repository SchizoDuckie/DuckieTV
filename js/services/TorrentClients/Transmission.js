DuckieTorrent

.controller("tbtCtrl", ["Transmission", "SettingsService",
    function(Transmission, SettingsService) {

        this.model = {
            server: SettingsService.get('transmission.server'),
            port: SettingsService.get('transmission.port'),
            use_auth: SettingsService.get('transmission.use_auth'),
            username: SettingsService.get('transmission.username'),
            password: SettingsService.get('transmission.password')
        };

        this.isConnected = function() {
            return Transmission.isConnected();
        }

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "Transmission Address",
                    type: "url",
                    placeholder: "Where to connect to"
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: "Port",
                    type: "number",
                    placeholder: "port to connect on (default 9091)"
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: "Use authentication"
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: "Username"
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: "Password",
                    type: "password"
                }
            },

        ];

        this.test = function() {
            console.log("Testing settings");
            Transmission.Disconnect();
            Transmission.setConfig(this.model);
            Transmission.connect().then(function(connected) {
                console.log("Transmission connected! (save settings)", connected);
                Transmission.saveConfig();
            }, function(error) {
                console.error("Transmission connect error!", error);
            })
        }
    }
])

.factory('Transmission', ["$q", "$http", "TransmissionRemote", "SettingsService",
    function($q, $http, TransmissionRemote, SettingsService) {
        var self = this;

        this.config = {
            server: SettingsService.get('transmission.server'),
            port: SettingsService.get('transmission.port'),
            use_auth: SettingsService.get('transmission.use_auth'),
            username: SettingsService.get('transmission.username'),
            password: SettingsService.get('transmission.password')
        };

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
            var url = this.config.server + ':' + this.config.port + this.endpoints[type];
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

            var headers = {
                'X-Transmission-Session-Id': self.sessionID
            };

            if (self.config.use_auth) {
                headers.Authorization = 'Basic ' + Base64.encode(self.config.username + ':' + self.config.password);
            }

            return $http.post(self.getUrl('rpc'), request, {
                headers: headers
            }).then(function(response) {
                return response.data;
            }, handleError);
        };

        var self = this;

        var methods = {

            setConfig: function(config) {
                self.config = config;
            },

            saveConfig: function() {
                Object.keys(self.config).map(function(key) {
                    SettingsService.set("transmission." + key, self.config[key]);
                });
            },

            connect: function() {
                return rpc('session-get').then(function(result) {
                    console.log("Transmission check result: ", result);
                    self.connected = result !== undefined;
                    if (!self.connected) {
                        throw "Transmission: Not connected.";
                    }
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

        var TransmissionData = function(data) {
            this.update(data);
        };

        TransmissionData.prototype.update = function(data) {
            Object.keys(data).map(function(key) {
                this[key] = data[key];
            }, this);
        }

        TransmissionData.prototype.getName = function() {
            return this.name;
        };

        TransmissionData.prototype.getProgress = function() {
            return parseFloat(new Number(this.percentDone * 100).toFixed(1))
        };
        TransmissionData.prototype.start = function() {
            DuckieTorrent.getClient().execute('torrent-start', this.id);
        };

        TransmissionData.prototype.stop = function() {
            DuckieTorrent.getClient().execute('torrent-stop', this.id);
        };
        TransmissionData.prototype.pause = function() {
            this.stop();
        };
        TransmissionData.prototype.getFiles = function() {

        };

        TransmissionData.prototype.isStarted = function() {
            return this.status > 0;
        }



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
                    service.torrents[key] = new TransmissionData(data);
                } else {
                    service.torrents[key].update(data);
                }


                $rootScope.$broadcast('torrent:update:' + key, service.torrents[key]);
                $rootScope.$broadcast('torrent:update:', service.torrents[key]);
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

    }
])