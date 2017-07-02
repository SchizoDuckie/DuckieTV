DuckieTorrent.factory('BaseTorrentRemote', ["$rootScope", "TorrentHashListService",
    function($rootScope,TorrentHashListService) {

        function BaseTorrentRemote() {
            this.torrents = {};
            this.dataClass = null;
            this.offMethods = {}; // callbacks map to de-register $rootScope.$on events
        }

        BaseTorrentRemote.prototype.handleEvent = function(data) {
            if (('hash' in data) && (data.hash !== undefined)){
                var key = data.hash.toUpperCase();
                if (!(key in this.torrents)) {
                    if (!this.dataClass) {
                        throw "No data class set for this torrent remote!";
                    }
                    this.torrents[key] = new this.dataClass(data);
                } else {
                    this.torrents[key].update(data);
                }

                $rootScope.$broadcast('torrent:update:' + key, this.torrents[key]);
                $rootScope.$broadcast('torrent:update:', this.torrents[key]);
            }
        };


        BaseTorrentRemote.prototype.getTorrents = function() {
            var out = [];
            angular.forEach(this.torrents, function(el) {
                if ('hash' in el) {
                    out.push(el);
                }
            });
            return out;
        };

        BaseTorrentRemote.prototype.getByHash = function(hash) {
            if (!hash) return null;
            // sometimes hash is passed as an Array (culprit unknown) instead of an expected String!!!
            hash = angular.isArray(hash) ? (hash[0]).toUpperCase() : hash.toUpperCase();
            return (hash in this.torrents) ? this.torrents[hash] : null;
        };

        BaseTorrentRemote.prototype.onTorrentUpdate = function(hash, callback) {

            var key = 'torrent:update:' + hash;
            if (!(key in this.offMethods)) {
                this.offMethods[key] = [];
            }
            this.offMethods[key].push($rootScope.$on(key, function(evt, torrent) {
                callback(torrent);
            }));
        };

        BaseTorrentRemote.prototype.offTorrentUpdate = function(hash, callback) {
            var key = 'torrent:update:' + hash;

            if ((key in this.offMethods)) {
                this.offMethods[key].map(function(dereg) {
                    dereg();
                });
            }
        };

        BaseTorrentRemote.prototype.removeTorrent = function(activeTorrentsList) {
            // determine which torrents in BaseTorrentRemote.torrents have been removed on the TorrentHost.
            var self = this;
            angular.forEach(self.torrents, function(torrent) {
                if ('hash' in torrent) {
                    var torrenthash = torrent.hash.toUpperCase();
                    if (activeTorrentsList.indexOf(torrenthash) == -1) {
                        Episode.findOneByMagnetHash(torrenthash).then(function(result) {
                            if (result) {
                                console.info('remote torrent not found, removed magnetHash[%s] from episode[%s] of series[%s]', result.magnetHash, result.getFormattedEpisode(), result.ID_Serie);
                                result.magnetHash = null;
                                result.Persist();
                            }
                        });
                        TorrentHashListService.removeFromHashList(torrenthash);
                        delete self.torrents[torrenthash].hash;
                        $rootScope.$broadcast('torrent:update:' + torrenthash, self.torrents[torrenthash]);
                        $rootScope.$broadcast('torrent:update:', self.torrents[torrenthash]);            
                    };
                };
            });
            this.torrents = self.torrents;
        };

        return BaseTorrentRemote;
    }
])


.factory('BaseTorrentClient', ["$rootScope", "$q", "$http", "URLBuilder", "$parse", "SettingsService",
    function($rootScope, $q, $http, URLBuilder, $parse, SettingsService) {

        var BaseTorrentClient = function() {
            this.config = {
                uses_custom_auth_method: false,
            };

            this.configMappings = {
                server: null,
                port: null,
                username: null,
                password: null,
                use_auth: null,
                path: null
            };

            this.name = 'Base Torrent Client';
            this.remoteClass = null;
            this.apiImplementation = null;

            this.isPolling = false;
            this.isConnecting = false;
            this.connected = false;
            this.initialized = false;
            this.offline = false;

        };

        var methods = {
            setConfig: function(config) {
                this.config = config;
                this.apiImplementation.config = this.config;
            },

            saveConfig: function() {
                Object.keys(this.configMappings).map(function(key) {
                    SettingsService.set(this.configMappings[key], this.apiImplementation.config[key]);
                }, this);
            },
            readConfig: function() {
                Object.keys(this.configMappings).map(function(key) {
                    this.apiImplementation.config[key] = this.config[key] = SettingsService.get(this.configMappings[key]);
                }, this);
            },
            setName: function(name) {
                this.name = name;
            },
            getName: function(name) {
                return this.name;
            },

            setConfigMappings: function(mappings) {
                Object.keys(mappings).map(function(key) {
                    this.configMappings[key] = mappings[key];
                }, this);
            },
            setEndpoints: function(endpoints) {
                Object.keys(endpoints).map(function(key) {
                    this.apiImplementation.endpoints[key] = endpoints[key];
                }, this);
            },

            setRemote: function(remoteImplementation) {
                this.remoteClass = remoteImplementation;
            },

            setAPI: function(apiImplementation) {
                this.apiImplementation = apiImplementation;
            },

            getAPI: function() {
                return this.apiImplementation;
            },

            /**
             * Return the interface that handles the remote data.
             */
            getRemote: function() {
                if (this.remoteClass === null) {
                    throw "No torrent remote assigned to " + this.getName() + "implementation!";
                }
                return this.remoteClass;
            },

            /**
             * Connect with an auth token obtained by the Pair function.
             * Store the resulting session key in $scope.session
             * You can call this method as often as you want. It'll return a promise that holds
             * off on resolving until the client is connected.
             * If it's connected and initialized, a promise will return that immediately resolves with the remote interface.
             */
            retryTimeout: null,
            AutoConnect: function() {
                if (!this.offline && !this.isConnecting && !this.connected) {
                    this.connectPromise = $q.defer();
                    this.isConnecting = true;
                } else {
                    return (!this.connected || !this.initialized) ? this.connectPromise.promise : $q(function(resolve) {
                        resolve(this.getRemote());
                    }.bind(this));
                }
                var self = this;
                this.connect().then(function(result) {
                    console.info(self.getName() + " connected!");
                    if (!self.isPolling) {
                        self.isPolling = true;
                        self.Update();
                    }
                    self.connectPromise.resolve(self.getRemote());
                }, function(error) {
                    self.isPolling = false;
                    self.isConnnecting = false;
                    self.connected = false;
                    self.offline = true;
                    clearTimeout(self.retryTimeout);
                    self.retryTimeout = setTimeout(function() {
                        self.offline = false;
                        self.AutoConnect();
                    }, 15000);
                    console.info("Unable to connect to " + self.getName() + " Retry in 15 seconds");
                    self.connectPromise.reject("Not connected.");
                    return false;
                });

                return self.connectPromise.promise;
            },

            togglePolling: function() {
                this.isPolling = !this.isPolling;
                this.Update();
            },
            /**
             * Start the status update polling.
             * Stores the resulting TorrentClient service in $scope.rpc
             * Starts polling every 1s.
             */
            Update: function(dontLoop) {
                if (this.isPolling === true) {
                    var self = this;
                    this.getTorrents().then(function(data) {
                        if (undefined === dontLoop && self.isPolling && !data.error) {
                            setTimeout(function() {
                                self.Update();
                            }, 3000);
                        }
                    });
                }
            },

            isConnecting: function() {
                return this.isConnecting;
            },

            isConnected: function() {
                return this.connected;
            },

            Disconnect: function() {
                this.isPolling = false;
                this.getRemote().torrents = {};
                this.getRemote().eventHandlers = {};
            },

            hasTorrent: function(torrent) {
                return $q.resolve(torrent in this.getRemote().torrents && 'hash' in this.getRemote().torrents[torrent]);
            },

            /**
             * -------------------------------------------------------------
             * Optionally overwrite the implementation of the methods below when adding a new torrent client.
             * You shouldn't have to, your API implementation should do the work.
             * -------------------------------------------------------------
             */



            /**
             *
             *
             * Example:
             *        return request('portscan').then(function(result) { // check if client WebUI is reachable
             *   console.log(service.getName() + " check result: ", result);
             *   self.connected = true; // we are now connected
             *   self.isConnecting = false; // we are no longer connecting
             *   return true;
             *  })
             */
            connect: function() {
                var self = this;
                return this.getAPI().portscan().then(function(result) { // check if client WebUI is reachable
                    //console.debug(self.getName() + " check result: ", result);
                    if (!result) {
                        self.isConnecting = false;
                        self.connected = false;
                        self.isPolling = false;
                        throw self.getName() + " Connect call failed.";
                    }
                    self.connected = result; // we are now connected
                    self.isConnecting = !result; // we are no longer connecting
                    $rootScope.$broadcast('torrentclient:connected', self.getRemote());
                    return result;
                });
            },

            /** 
             * Execute and handle the API's 'update' query.
             * Parses out the events, updates, properties and methods and dispatches them to the TorrentRemote interface
             * for storage, handling and attaching RPC methods.
             */

            getTorrents: function() {
                var self = this,
                    remote = this.getRemote();
                return this.getAPI().getTorrents()
                    .then(function(data) {
                        var activeTorrents = [];
                        data.map(function(torrent) {
                            remote.handleEvent(torrent);
                            activeTorrents.push(torrent.hash.toUpperCase());
                        })
                        remote.removeTorrent(activeTorrents);
                        return data;
                    }, function(error) {
                        throw "Error executing " + self.getName() + " getTorrents";
                    });
            },

            /**
             * Implement this function to be able to add a magnet to the client
             */
            addMagnet: function(magnet, dlPath, label) {
                if (!('addMagnet' in this.getAPI())) {
                    throw "addMagnet not implemented for " + this.getName();
                }
                return this.getAPI().addMagnet(magnet, dlPath, label);

            },

            /**
             * Implement this function to be able to add a torrent by URL to the client.
             */
            addTorrentByUrl: function(url, infoHash, releaseName, dlPath, label) {
                if (!('addTorrentByUrl' in this.getAPI())) {
                    throw "addTorrentByUrl not implemented for " + this.getName();
                }
                return this.getAPI().addTorrentByUrl(url, infoHash, releaseName, dlPath, label);
            },

            /**
             * Implement this function to be able to add a torrent by torrent Blob to the client.
             */
            addTorrentByUpload: function(data, infoHash, releaseName, dlPath, label) {
                if (!('addTorrentByUpload' in this.getAPI())) {
                    throw "addTorrentByUpload not implemented for " + this.getName();
                }
                return this.getAPI().addTorrentByUpload(data, infoHash, releaseName, dlPath, label);
            },

            /**
             * the default is that the client does not support setting the Download Path when adding magnets and .torrents. 
             */
            isDownloadPathSupported: function() {
                if (!('isDownloadPathSupported' in this.getAPI())) {
                    return false;
                }
                return this.getAPI().isDownloadPathSupported();
            },

            /**
             * the default is that the client does not support setting a Label when adding magnets and .torrents. 
             */
            isLabelSupported: function() {
                if (!('isLabelSupported' in this.getAPI())) {
                    return false;
                }
                return this.getAPI().isLabelSupported();
            },

            request: function(type, params, options) {
                return request(type, params, options);
            }


        };

        Object.keys(methods).map(function(key) {
            BaseTorrentClient.prototype[key] = methods[key];
        });

        return BaseTorrentClient;
    }
]);