DuckieTorrent

.controller("vuzeCtrl", ["Vuze", "SettingsService", "$filter",
    function(Vuze, SettingsService, $filter) {

        this.model = {
            server: SettingsService.get('vuze.server'),
            port: SettingsService.get('vuze.port'),
            use_auth: SettingsService.get('vuze.use_auth'),
            username: SettingsService.get('vuze.username'),
            password: SettingsService.get('vuze.password')
        };

        this.isConnected = function() {
            return Vuze.isConnected();
        }

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "Vuze " + $filter('translate')('SETTINGS/VUZE/address/lbl'),
                    type: "url",
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('SETTINGS/VUZE/port/lbl'),
                    type: "number",
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: $filter('translate')('SETTINGS/VUZE/authentication/lbl')
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('SETTINGS/VUZE/username/lbl')
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('SETTINGS/VUZE/password/lbl'),
                    type: "password"
                }
            },

        ];

        this.test = function() {
            //console.log("Testing settings");
            Vuze.Disconnect();
            Vuze.setConfig(this.model);
            Vuze.connect().then(function(connected) {
                console.info("Vuze connected! (save settings)", connected);
                Vuze.saveConfig();
            }, function(error) {
                console.error("Vuze connect error!", error);
            })
        }
    }
])

.factory('Vuze', ["$q", "$http", "VuzeRemote", "SettingsService",
    function($q, $http, VuzeRemote, SettingsService) {
        var self = this;

        this.config = {
            server: SettingsService.get('vuze.server'),
            port: SettingsService.get('vuze.port'),
            use_auth: SettingsService.get('vuze.use_auth'),
            username: SettingsService.get('vuze.username'),
            password: SettingsService.get('vuze.password')
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
                    self.sessionID = e.headers('X-Vuze-Session-Id')
                    return rpc(method, request, options);
                }
            }

            var headers = {
                'X-Vuze-Session-Id': self.sessionID
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
                    SettingsService.set("vuze." + key, self.config[key]);
                });
            },

            connect: function() {
                return rpc('session-get').then(function(result) {
                    console.log("Vuze check result: ", result);
                    self.connected = result !== undefined;
                    if (!self.connected) {
                        throw "Vuze: Not connected.";
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
                            VuzeRemote.handleEvent(el);
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
                return VuzeRemote;
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
                VuzeRemote.torrents = {};
                VuzeRemote.eventHandlers = {};
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
.factory('VuzeRemote', ["$rootScope", "DuckieTorrent",
    function($rootScope, DuckieTorrent) {

        var VuzeData = function(data) {
            this.update(data);
        };

        VuzeData.prototype.update = function(data) {
            Object.keys(data).map(function(key) {
                this[key] = data[key];
            }, this);
        }

        VuzeData.prototype.getName = function() {
            return this.name;
        };

        VuzeData.prototype.getProgress = function() {
            return parseFloat(new Number(this.percentDone * 100).toFixed(1))
        };
        VuzeData.prototype.start = function() {
            DuckieTorrent.getClient().execute('torrent-start', this.id);
        };

        VuzeData.prototype.stop = function() {
            DuckieTorrent.getClient().execute('torrent-stop', this.id);
        };
        VuzeData.prototype.pause = function() {
            this.stop();
        };
        VuzeData.prototype.getFiles = function() {

        };

        VuzeData.prototype.isStarted = function() {
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
                    service.torrents[key] = new VuzeData(data);
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

.run(["DuckieTorrent", "Vuze",
    function(DuckieTorrent, Vuze) {

        DuckieTorrent.register('Vuze', Vuze);

    }
])