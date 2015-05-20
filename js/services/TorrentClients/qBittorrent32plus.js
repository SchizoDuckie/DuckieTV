DuckieTorrent

.controller("qbt32plusCtrl", ["qBittorrent32plus", "SettingsService", "ChromePermissions", "$filter",
    function(qBittorrent32plus, SettingsService, ChromePermissions, $filter) {

        this.model = {
            server: SettingsService.get('qbittorrent32plus.server'),
            port: SettingsService.get('qbittorrent32plus.port'),
            use_auth: SettingsService.get('qbittorrent32plus.use_auth'),
            username: SettingsService.get('qbittorrent32plus.username'),
            password: SettingsService.get('qbittorrent32plus.password')
        };

        this.isConnected = function() {
            return qBittorrent32plus.isConnected();
        }

        this.fields = [{
                key: "server",
                type: "input",
                templateOptions: {
                    label: "qBittorrent " + $filter('translate')('QBITTORRENTjs/address/lbl'),
                    type: "url",
                }
            }, {
                key: "port",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('QBITTORRENTjs/port/lbl'),
                    type: "number",
                }
            }, {
                key: "use_auth",
                type: "input",
                templateOptions: {
                    type: "checkbox",
                    label: $filter('translate')('QBITTORRENTjs/authentication/lbl')
                }
            }, {
                key: "username",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('QBITTORRENTjs/username/lbl')
                }
            }, {
                key: "password",
                type: "input",
                templateOptions: {
                    label: $filter('translate')('QBITTORRENTjs/password/lbl'),
                    type: "password"
                }
            },

        ];

        this.test = function() {
            //console.log("Testing settings");
            qBittorrent32plus.Disconnect();
            qBittorrent32plus.setConfig(this.model);
            qBittorrent32plus.connect().then(function(connected) {
                console.info("qBittorrent 3.2+ connected! (save settings)", connected);
                qBittorrent32plus.saveConfig();
            }, function(error) {
                console.error("qBittorrent 3.2+ connect error!", error);
            })
        }


        this.requestCookiePermission = function(event) {
            // Permissions must be requested from inside a user gesture, like a button's
            // click handler.
            if (ChromePermissions.isSupported()) {
                chrome.permissions.request({
                    permissions: ['cookies'],
                    origins: [this.model.server + ':' + this.model.port+'/']
                }, function(granted) {
                    // The callback argument will be true if the user granted the permissions.
                    if (granted) {

                    } else {
                        alert("Cookie permission denied!");
                    }
                });

            } else {
                alert("Not in standalone mode yet!");
            }
        };
    }
])

.factory('qBittorrent32plus', ["$q", "$http", "URLBuilder", "$parse", "qBittorrent32plusRemote", "SettingsService", "ChromePermissions",
    function($q, $http, URLBuilder, $parse, qBittorrent32plusRemote, SettingsService, ChromePermissions) {
        var self = this;

        this.config = {
            server: SettingsService.get('qbittorrent32plus.server'),
            port: SettingsService.get('qbittorrent32plus.port'),
            use_auth: SettingsService.get('qbittorrent32plus.use_auth'),
            username: SettingsService.get('qbittorrent32plus.username'),
            password: SettingsService.get('qbittorrent32plus.password')
        };

        /** 
         * Predefined endpoints for API actions.
         */
        this.endpoints = {

            torrents: '/query/torrents',
            addmagnet: '/command/download',
            resume: '/command/resume',
            pause: '/command/pause',
            files: '/query/propertiesFiles/%s',
            version: '/version/api',
            login: '/login'
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
            return out.replace('%s', encodeURIComponent(param));
        };

        this.isPolling = false;
        this.isConnecting = false;
        this.connected = false;
        this.initialized = false;
        this.token = null; // cookie login token.

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
                    SettingsService.set("qbittorrent32plus." + key, self.config[key]);
                });
            },

            connect: function() {

                return json('version').then(function(result) {
                    console.log("qBittorrent version result: ", result);
                    return methods.login().then(function() {
                        self.connected = true;
                    })
                })
            },

            login: function() {

                return $http.post(self.getUrl('login'), 'username=' + encodeURIComponent(self.config.username) + '&password=' + encodeURIComponent(self.config.password), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }).then(function(result) {
                    if (result.data == "Ok.") {
                        return true;
                    } else {
                        throw "Login failed!";
                    }
                });

            },

            /** 
             * Execute and handle the api's 'update' query.
             * Parses out the events, updates, properties and methods and dispatches them to the TorrentRemote interface
             * for storage, handling and attaching RPC methods.
             */
            statusQuery: function() {
                return json('torrents', {}).then(function(data) {
                        data.map(function(el) {
                            qBittorrent32plusRemote.handleEvent(el);
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
                return qBittorrent32plusRemote;
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
                qBittorrent32plusRemote.torrents = {};
                qBittorrent32plusRemote.eventHandlers = {};
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
                    headers.Cookie = 'SID=' + self.token;
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
                    headers.Cookie = 'SID=' + self.token;
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
.factory('qBittorrent32plusRemote', ["$rootScope", "DuckieTorrent",
    function($rootScope, DuckieTorrent) {

        /**
         * Round a number with Math.floor so that we don't lose precision on 99.7%
         */
        function round(x, n) {
            return Math.floor(x * Math.pow(10, n)) / Math.pow(10, n)
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
                    data.getName = function() {
                        return this.name;
                    };

                    data.getProgress = function() {
                        return round(this.progress * 100, 1);
                    };

                    data.start = function() {
                        DuckieTorrent.getClient().execute('resume', this.hash);
                    };

                    data.stop = function() {
                        return this.pause();
                    };

                    data.pause = function() {
                        DuckieTorrent.getClient().execute('pause', this.hash)
                    };

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

.run(["DuckieTorrent", "qBittorrent32plus",
    function(DuckieTorrent, qBittorrent32plus) {

        DuckieTorrent.register('qBittorrent 3.2+', qBittorrent32plus);
    }
])
