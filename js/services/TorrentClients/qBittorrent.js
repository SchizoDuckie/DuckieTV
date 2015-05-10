DuckieTorrent

.controller("qbtCtrl", ["qBittorrent", "SettingsService",
    function(qBittorrent, SettingsService) {

        this.model = {
            server: SettingsService.get('qbittorrent.server'),
            port: SettingsService.get('qbittorrent.port'),
            use_auth: SettingsService.get('qbittorrent.use_auth'),
            username: SettingsService.get('qbittorrent.username'),
            password: SettingsService.get('qbittorrent.password')
        };

        this.isConnected = function() {
            return qBittorrent.isConnected();
        }

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "qBittorrent Address",
                    type: "url",
                    placeholder: "Where to connect to"
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: "Port",
                    type: "number",
                    placeholder: "port to connect on (default 8080)"
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
            qBittorrent.Disconnect();
            qBittorrent.setConfig(this.model);
            qBittorrent.connect().then(function(connected) {
                console.log("qBittorrent connected! (save settings)", connected);
                qBittorrent.saveConfig();
            }, function(error) {
                console.error("qBittorrent connect error!", error);
            })
        }
    }
])

.factory('qBittorrent', ["$q", "$http", "URLBuilder", "$parse", "qBittorrentRemote", "SettingsService",
    function($q, $http, URLBuilder, $parse, qBittorrentRemote, SettingsService) {
        var self = this;

        this.config = {
            server: SettingsService.get('qbittorrent.server'),
            port: SettingsService.get('qbittorrent.port'),
            use_auth: SettingsService.get('qbittorrent.use_auth'),
            username: SettingsService.get('qbittorrent.username'),
            password: SettingsService.get('qbittorrent.password')
        };

        /** 
         * Predefined endpoints for API actions.
         */
        this.endpoints = {

            torrents: '/json/torrents',
            portscan: '/json/transferInfo',
            addmagnet: '/command/download',
            resume: '/command/resume',
            pause: '/command/pause',
            files: '/json/propertiesFiles/%s'

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
            var out = self.config.server + ':' + self.config.port + this.endpoints[type];

            if (self.config.use_auth) {
                out = out.replace('://', '://' + self.config.username + ':' + self.config.password + '@');
            }

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
        var json = function(type, param, options) {
            var d = $q.defer();
            param = param || '';
            var url = self.getUrl(type, param)
            var parser = self.getParser(type);

            var headers = {};

            $http.get(url, options || {}, {
                headers: headers
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


            setConfig: function(config) {
                self.config = config;
            },

            saveConfig: function() {
                Object.keys(self.config).map(function(key) {
                    SettingsService.set("tixati." + key, self.config[key]);
                });
            },

            connect: function() {

                return json('portscan').then(function(result) {
                    console.log("qBittorrent check result: ", result);
                    self.connected = true;
                })
            },

            /** 
             * Execute and handle the api's 'update' query.
             * Parses out the events, updates, properties and methods and dispatches them to the TorrentRemote interface
             * for storage, handling and attaching RPC methods.
             */
            statusQuery: function() {
                return json('torrents', {}).then(function(data) {
                        data.map(function(el) {
                            qBittorrentRemote.handleEvent(el);
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
                return qBittorrentRemote;
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
                qBittorrentRemote.torrents = {};
                qBittorrentRemote.eventHandlers = {};
            },

            getFilesList: function(hash) {
                return json('files', hash).then(function(data) {
                    return data;
                });
            },

            addMagnet: function(magnet) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };

                if (self.config.use_auth) {
                    headers.Authorization = 'Basic ' + Base64.encode(self.config.username + ':' + self.config.password);
                }
                return $http.post(self.getUrl('addmagnet'), 'urls=' + encodeURIComponent(magnet), {
                    headers: headers
                });
            },

            execute: function(method, hash) {
                var headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };

                if (self.config.use_auth) {
                    headers.Authorization = 'Basic ' + Base64.encode(self.config.username + ':' + self.config.password);
                }
                return $http.post(self.getUrl(method), 'hash=' + hash, {
                    headers: headers
                });
            }


        };
        return methods;
    }
])

/**
 * uTorrent/Bittorrent remote singleton that receives the incoming data
 */
.factory('qBittorrentRemote', ["$rootScope", "DuckieTorrent",
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
                        return parseFloat(new Number(this.progress * 100).toFixed(1))
                    }
                    data.start = function() {
                        DuckieTorrent.getClient().execute('resume', this.hash);
                    };

                    data.stop = function() {
                        return this.pause();
                    }
                    data.pause = function() {
                        DuckieTorrent.getClient().execute('pause', this.hash)
                    }
                    data.getFiles = function() {
                        DuckieTorrent.getClient().getFilesList(this.hash).then(function(results) {
                            service.torrents[key].files = results;
                            $rootScope.$applyAsync();
                        })
                    }
                    service.torrents[key] = data;
                } else {
                    Object.keys(data).map(function(property) {
                        service.torrents[key][property] = data[property];
                    })
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

.run(["DuckieTorrent", "qBittorrent",
    function(DuckieTorrent, qBittorrent) {

        DuckieTorrent.register('qBittorrent', qBittorrent);
    }
])