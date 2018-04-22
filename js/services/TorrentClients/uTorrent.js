DuckieTorrent
/**
 * DuckieTorrent Utorrent (v3.3+)/ Bittorrent interface
 * Inspired by and reverse-engineered from Bittorrent's Torque labs btapp.js
 *
 * https://github.com/bittorrenttorque
 * https://github.com/bittorrenttorque/btapp
 * https://github.com/bittorrenttorque/visualizer
 *
 * This project was started because I have an angular.js app and I do not want the
 * dependencies to Torque, Backbone, Lodash, etc that btapp.js has. This should be a service with
 * a completely separated GUI, which it is now.
 *
 * The Utorrent/Bittorrent clients listen on one of 20 ports on localhost to allow other apps to connect
 * to them.
 * *****************************************************************
 * port 10000 is no longer discoverable as at version 3.5.3
 * https://engineering.bittorrent.com/2018/02/22/httprpc-security-vulnerabilities-resolved-in-utorrent-bittorrent-and-utorrent-web/
 * *****************************************************************
 * Discovery is done by performing a /version request to these ports until the first hit
 * After that, an authentication token is requested on the client (you need to save this somewhere, the demo does so in localStorage)
 * With the token you can get a session ID, and with the session ID you can start polling for data. Don't poll and the session will expire
 * and you will need to fetch a new session ID with the token.
 *
 * Polling for data results in a tree structure of RPC functions and object data
 * The RPC structures are matched against regexes and the parameters are type-checked.
 * Passing the wrong data into a callback will crash uTorrent/BitTorrent violently (Which could be an attack angle for security researchers)
 *
 * Since the amount of data that's returned from the torrent application to the browser can be quite large, multiple requests will build up your
 * local state (stored in the uTorrentRemote service)
 *
 * - Does not support setting the download directory (I have not found any docs so far for parms of btapp.add.torrent(). Garfield69)
 * - Does not support setting a Label during add.torrent (I have not found any docs so far for parms of btapp.add.torrent(). Garfield69)
 */
.provider('uTorrent', function() {

    /** 
     * Predefined endpoints for API actions.
     */
    this.endpoints = {
        pair: 'http://localhost:%s/gui/pair',
        version: 'http://localhost:%s/version/',
        ping: 'http://localhost:%s/gui/pingimg',
        api: 'http://localhost:%s/btapp/',
    };

    /**
     * If a specialized parser is needed for a response than it can be automatically picked up by adding the type and a parser
     * function here.
     */
    this.parsers = {

    };

    /**
     * Automated parser for responses for usage when necessary
     */
    this.getParser = function(type) {
        return (type in this.parsers) ? this.parsers[type] : function(data) {
            return data.data;
        };
    };

    /**
     * Fetches the URL, auto-replaces the port in the URL if it was found.
     */
    this.getUrl = function(type, param) {
        var out = this.endpoints[type];
        if (this.port != null) {
            out = out.replace('%s', this.port);
        }
        return out.replace('%s', encodeURIComponent(param));
    };

    this.currentPort = 0;
    this.port = null;
    this.sessionKey = null;
    this.authToken = null;
    this.isPolling = false;
    this.isConnecting = false;
    this.connected = false;
    this.initialized = false;

    this.$get = ["$rootScope", "$q", "$http", "URLBuilder", "$parse", "uTorrentRemote", "$sce",
        function($rootScope, $q, $http, URLBuilder, $parse, uTorrentRemote, $sce) {
            var self = this;

            /**
             * Build a JSONP request using the URLBuilder service.
             * Auto-magically adds the JSON_CB option and executes the built in parser, or returns the result
             * JSON_CALLBACK cannot be used as a callback name anymore apparently.
             * @param string type URL to fetch from the request types
             * @param object params GET parameters
             * @param object options $http optional options
             */
            var jsonp = function(type, params, options) {
                var d = $q.defer();
                params = angular.extend(params || {}, {
                    jsonpCallbackParam: 'JSON_CB'
                });

                var parser = self.getParser(type);
                var url = URLBuilder.build(self.getUrl(type), params);
                var safeUrl = $sce.trustAsResourceUrl(url); // Untrusted URLs will no longer work

                $http.jsonp(safeUrl, options || {}).then(function(response) {
                    d.resolve(parser ? parser(response) : response.data);
                }, function(err) {
                    d.reject(err);
                });
                return d.promise;
            };

            var methods = {
                getName: function() {
                    return 'uTorrent';
                },
                /**
                 * Execute a portScan on one of the 20 ports that were generated with the algorithm, stop scanning when a response is found.
                 * Sets the found port index in self.currentPort;
                 */
                portScan: function(ports) {
                    var d = $q.defer();

                    var nextPort = function() {
                        self.port = ports[self.currentPort];
                        jsonp('version',{},{timeout: 850}).then(function(result) {
                            if (typeof result === 'undefined') {
                                d.reject("no torrent client listening on port " + self.port);
                            }
                            d.resolve({
                                port: ports[self.currentPort],
                                version: result
                            });
                        }, function(err) {
                            if (self.currentPort < 20) {
                                self.currentPort++;
                                nextPort();
                            } else {
                                d.reject("No active uTorrent/BitTorrent client found!");
                            }
                        });
                    };
                    nextPort();
                    return d.promise;
                },
                setPort: function(port) {
                    self.port = port;
                },
                /**
                 * Execute a torrent client pair request, and give the user 60 seconds to respond.
                 */
                pair: function() {
                    return jsonp('pair', {
                        name: 'DuckieTV'
                    }, {
                        timeout: 60000
                    });
                },
                /**
                 * Once you've fetched an authentication token, call this function with it to establish a connection.
                 * Note : The connection needs to be kept open by polling or the session will time out.
                 */
                connect: function(authToken) {
                    if (self.connected) {
                        var p = $q.defer();
                        p.resolve(function() {
                            return {
                                session: self.sessionKey,
                                authToken: self.authToken
                            };
                        });
                        return p.promise;
                    }
                    return jsonp('api', {
                        pairing: authToken,
                        type: 'state',
                        queries: '[["btapp"]]',
                        hostname: window.location.host
                    }).then(function(session) {
                        console.info("Retrieved session key!", session);
                        self.sessionKey = session.session;
                        self.authToken = authToken;
                        self.connected = true;
                        $rootScope.$broadcast('torrentclient:connected', methods.getRemote());
                        return session;
                    }, function(fail) {
                        console.error("Error starting session with auth token %s!", authToken);
                    });
                },
                /** 
                 * Execute and handle the API's 'update' query.
                 * Parses out the events, updates, properties and methods and dispatches them to the uTorrentRemote interface
                 * for storage, handling and attaching RPC methods.
                 */
                statusQuery: function() {
                    return jsonp('api', {
                        pairing: self.authToken,
                        session: self.sessionKey,
                        type: 'update',
                        hostname: window.location.host
                    }).then(function(data) {
                        if (data == "invalid request") {
                            throw "unauthorized";
                        }
                        if ('error' in data) {
                            return {
                                error: data
                            };
                        }
                        data.map(function(el) {
                            var type = Object.keys(el)[0];
                            var category = Object.keys(el[type].btapp)[0];
                            var data;
                            if (typeof el[type].btapp[category] == 'string') {
                                category = 'btappMethods';
                                data = el[type].btapp;
                            } else {
                                data = 'all' in el[type].btapp[category] && !('set' in el[type].btapp[category]) ? el[type].btapp[category].all : el[type].btapp[category];
                                if (!('all' in el[type].btapp[category]) || 'set' in el[type].btapp[category]) category += 'Methods';
                            }
                            //console.debug("Handle remote", el, type, category, data);
                            uTorrentRemote.handleEvent(type, category, data, methods.RPC);
                        });
                        return data;
                    }, function(error) {
                        console.error("Error executing get status query!", error);
                    });
                },
                /**
                 * Return the interface that handles the remote data.
                 */
                getRemote: function() {
                    return uTorrentRemote;
                },
                /** 
                 * Execute a remote procedure function.
                 * This function is passed all the way from here to the actual RPCObject's function.
                 */
                RPC: function(path, args) {
                    p = path.split('.');
                    if (!args) args = [];
                    return jsonp('api', {
                        pairing: self.authToken,
                        session: self.sessionKey,
                        type: 'function',
                        path: [p],
                        'args': JSON.stringify(args),
                        hostname: window.location.host
                    });
                },
                /**
                 * Todo: listen for these events
                 */
                attachEvents: function() {
                    /*{ "add": { "btapp": { "events": { "all": { "
                    path:["btapp","events","set"]
                    args:["appDownloadProgress","bt_05321785204295053489"]
                    path:["btapp","events","set"]
                    args:["appMessage","bt_56894816204235029082"]
                    path:["btapp","events","set"]
                    args:["appStopping","bt_78413389069652724491"]
                    path:["btapp","events","set"]
                    args:["appUninstall","bt_61359101496962791011"] */
                },
                /**
                 * Execute a portScan on any of the 20 ports that are generated by the get_port API until one works.
                 * If it works, store it in uTorrent.port
                 */
                retryTimeout: null,
                Scan: function() {
                    var p = $q.defer();
                    var ports = [];
                    for (var i = 0; i < 20; i++) {
                        ports.push(7 * Math.pow(i, 3) + 3 * Math.pow(i, 2) + 5 * i + 10000);
                    }
                    methods.portScan(ports).then(function(result) {
                        //console.debug("Ping result on port", result);
                        localStorage.setItem('utorrent.port', result.port);
                        methods.setPort(result.port);
                        p.resolve(result.port);
                    }, function(err) {
                        clearTimeout(self.retryTimeout);
                        self.currentPort = 0;
                        self.port = null;
                        self.sessionKey = null;
                        self.authToken = null;
                        self.isPolling = false;
                        self.isConnecting = false;
                        self.connected = false;
                        self.initialized = false;
                        self.retryTimeout = setTimeout(function() {
                            self.offline = false;
                            methods.AutoConnect();
                        }, 15000);
                        console.info("Unable to connect to " + methods.getName() + " Retry in 15 seconds");
                    });
                    return p.promise;
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

                    /**
                     * A little promise-setTimeout loop to wait for uTorrent to finish flushing all it's torrent data
                     * The once we're connected
                     */
                    var waitForInitialisation = function() {
                        if (!self.initPromise) {
                            self.initPromise = $q.defer();
                        }

                        if (self.connected && self.initialized) {
                            self.initPromise.resolve(true);
                            return;
                        }

                        if (!self.connected || !self.initialized) {
                            setTimeout(waitForInitialisation, 50);
                        }

                        return self.initPromise.promise;
                    }

                    var connectFunc = function() {
                        methods.connect(localStorage.getItem('utorrent.token')).then(function(result) {
                            if (!self.isPolling) {
                                self.isPolling = true;
                                methods.Update();
                            }
                            self.isConnecting = false;
                            waitForInitialisation().then(function() {
                                self.connectPromise.resolve(methods.getRemote());
                            })
                        });
                    }

                    if (!localStorage.getItem('utorrent.preventconnecting') && !localStorage.getItem('utorrent.token')) {
                        methods.Scan().then(function() {
                            methods.Pair().then(connectFunc, function(error) {
                                if (error == "PAIR_DENIED" && confirm("You denied the uTorrent/BitTorrent Client request. \r\nDo you wish to prevent any future connection attempt?")) {
                                    localStorage.setItem('utorrent.preventconnecting', true);
                                }
                            });
                        });
                    } else {
                        if (!localStorage.getItem('utorrent.preventconnecting')) {
                            methods.Scan().then(connectFunc);
                        }
                    }

                    return self.connectPromise.promise;
                },

                /**
                 * Execute a pair promise against uTorrent
                 * It waits 30 seconds for the promise to timeout.
                 * When it works, it stores the returned auth token for connecting with the Connect function
                 */
                Pair: function() {
                    return methods.pair().then(function(result) {
                        //console.debug("Received auth token!", result);
                        var key = typeof result == 'object' ? result.pairing_key : result; // switch between 3.3.x and 3.4.1 build 31206 pairing method
                        if (key == '<NULL>') {
                            throw "PAIR_DENIED";
                        } else {
                            localStorage.setItem('utorrent.token', key);
                            self.authToken = result; // .pairing_key;
                        }
                    }, function(err) {
                        console.error("Eror pairing!", err);
                    });
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
                    if (self.isPolling === true) {
                        return methods.statusQuery().then(function(data) {
                            if (data.length === 0) {
                                self.initialized = true;
                            }
                            if (undefined === dontLoop && self.isPolling && !data.error) {
                                setTimeout(methods.Update, data && data.length === 0 ? 3000 : 0); // burst when more data comes in, delay when things ease up.
                            }
                            return data;
                        });
                    }
                },
                isConnected: function() {
                    return self.connected;
                },
                Disconnect: function() {
                    self.isPolling = false;
                    uTorrentRemote.torrents = {};
                    uTorrentRemote.eventHandlers = {};
                },
                addMagnet: function(magnet) {
                    uTorrentRemote.add.torrent(magnet);
                },
                addTorrentByUpload: function() {
                    throw "Upload Torrent Not implemented in uTorrent remote.";
                },

                addTorrentByUrl: function(url, infoHash) {
                    return uTorrentRemote.add.torrent(url).then(function(result) {
                        return methods.Update(true);
                    }).then(function() {
                        return $q(function(resolve) {
                            setTimeout(function() {
                                var matches = Object.keys(uTorrentRemote.torrents).filter(function(key) {
                                    return uTorrentRemote.torrents[key].properties.all.hash.toUpperCase() == infoHash;
                                });
                                if (matches.length > 0) {
                                    resolve(matches[0]);
                                }
                            }, 5000);
                        });
                    });
                },
                /**
                 * this API does not currently support setting the Download Path when adding magnets and .torrents. 
                 */
                isDownloadPathSupported: function() {
                    return false;
                },
                /**
                 * this API does not currently support setting a Label when adding magnets and .torrents. 
                 */
                isLabelSupported: function() {
                    return false;
                },
                hasTorrent: function(torrent) {
                    return $q.resolve(torrent in uTorrentRemote.torrents && 'hash' in uTorrentRemote.torrents[torrent]);
                }
            };
            return methods;
        }
    ];
})
/**
 * Some RPC Call validation methods taken mostly directly from btapp.js
 * Converted to plain angular / JavaScript to keep this dependency-free
 */
.factory('RPCCallService', function() {
    var service = {
        // Seeing as we're interfacing with a strongly typed language c/c++ we need to
        // ensure that our types are at least close enough to coherse into the desired types
        // takes something along the lines of "[native function](string,unknown)(string)".
        validateArguments: function(functionValue, variables) {
            if (typeof functionValue !== 'string') {
                console.error("Expected functionValue to be a string", functionValue, typeof functionValue, variables);
                return false;
            }
            var signatures = functionValue.match(/\(.*?\)/g);
            return signatures.filter(function(signature) {
                signature = signature.match(/\w+/g) || []; //["string","unknown"]
                return signature.length === variables.length && signature.map(function(type, index) {
                    if (typeof variables[index] === 'undefined') {
                        throw 'client functions do not support undefined arguments';
                    } else if (variables[index] === null) {
                        return true;
                    }

                    switch (type) {
                        //Most of these types that the client sends up match the typeof values of the JavaScript
                        //types themselves so we can do a direct comparison
                        case 'number':
                        case 'string':
                        case 'boolean':
                            return typeof variables[index] === type;
                            //In the case of unknown, we have no choice but to trust the argument as
                            //the client hasn't specified what type it should be
                        case 'unknown':
                            return true;
                        case 'array':
                            return typeof variables[index] === 'object';
                        case 'dispatch':
                            return typeof variables[index] === 'object' || typeof variables[index] === 'function';
                        default:
                            //has the client provided a type that we weren't expecting?
                            throw 'there is an invalid type in the function signature exposed by the client';
                    }
                });
            });
        },
        convertCallbackFunctionArgs: function(args) {
            args.map(function(value, key) {
                // We are responsible for converting functions to variable names...
                // this will be called later via a event with a callback and arguments variables
                if (typeof value === 'function') {
                    args[key] = service.storeCallbackFunction(value);
                } else if (typeof value === 'object' && value) {
                    service.convertCallbackFunctionArgs(value);
                }
            }, this);
        },
        // We can't send function pointers to the torrent client server, so we'll send
        // the name of the callback, and the server can call this by sending an event with
        // the name and args back to us. We're responsible for making the call to the function
        // when we detect this. This is the same way that jquery handles ajax callbacks.
        storeCallbackFunction: function(cb) {
            //console.debug("Create a callback function for ", cb);
            cb = cb || function() {};
            var str = 'bt_' + new Date().getTime();
            this.btappCallbacks[str] = cb;
            return str;
        },
        call: function(path, signature, args, rpcTarget) {
            //console.debug("Trying to call RPC function: ", path, signature, args);
            // This is as close to a static class function as you can get in JavaScript i guess
            // we should be able to use verifySignaturesArguments to determine if the client will
            // consider the arguments that we're passing to be valid
            if (!service.validateArguments.call(service, signature, args)) {
                console.error("Arguments do not match signature!", args, signature, path);
                throw 'arguments do not match any of the function signatures exposed by the client';
            }
            service.convertCallbackFunctionArgs(args);
            //console.debug("Calling RPC Function!", path, signature, args, rpcTarget);
            return rpcTarget(path, args);
        }
    };

    return service;
})
/**
 * uTorrent/Bittorrent remote singleton that receives the incoming data
 */
.factory('uTorrentRemote', ["$parse", "$rootScope", "RPCCallService", "TorrentHashListService",
    function($parse, $rootScope, RPCCallService, TorrentHashListService) {

        /**
         * RPC Object that wraps the remote data that comes in from uTorrent.
         * It stores all regular properties on itself
         * and makes sure that the remote function signatures are verified (using some code borrowed from the original btapp.js)
         * and a dispatching function with the matching signature is created and mapped to the RPCCallService
         * (to keep the overhead of creating many RPC call functions as low as possible)
         */
        var RPCObject = function(path, data, RPCProxy) {
            var callbacks = {};

            for (var property in data) {
                this[property] = this.isRPCFunctionSignature(data[property]) ? this.createFunction(path, property, data[property], RPCProxy) : data[property];
            }
        };

        RPCObject.prototype = {
            /**
             * Return a human-readable status for a torrent
             */
            getFormattedStatus: function() {
                var statuses = {
                    128: 'stopped',
                    136: 'stopped',
                    137: 'started',
                    152: 'Error: Files missing, please recheck',
                    198: 'Connecting to peers',
                    200: 'started',
                    201: 'downloading',
                    233: 'paused'
                };
                if (!(this.properties.all.status in statuses)) {
                    console.warn("There's an unknown status for this torrent!", this.properties.all.status, this);
                    return this.properties.all.status;
                }
                return statuses[this.properties.all.status];
            },
            getName: function() {
                return $parse('properties.all.name')(this);
            },
            getStarted: function() {
                return $parse('properties.all.added_on')(this);
            },
            getProgress: function() {
                var pr = $parse('properties.all.progress')(this);
                return pr ? pr / 10 : pr;
            },
            getDownloadSpeed: function() {
                return $parse('properties.all.download_speed')(this);
            },
            getStatusCode: function() {
                return this.properties.all.status;
            },
            getFiles: function() {
                var files = [];
                angular.forEach($parse('file.all')(this), function(el, key) {
                    files.push(el);
                });
                angular.forEach($parse('files.all')(this), function(el, key) {
                    files.push(el);
                });
                return new Promise(function(resolve) {
                    resolve(files);
                });
            },
            getDownloadDir: function() {
                return $parse('properties.all.directory')(this);
            },
            /**
             * The torrent is started if the status is uneven.
             */
            isStarted: function() {
                return this.properties.all.status % 2 === 1;
            },
            // We expect function signatures that come from the client to have a specific syntax
            isRPCFunctionSignature: function(f) {
                return typeof f === 'string' && (f.match(/\[native function\](\([^\)]*\))+/) || f.match(/\[nf\](\([^\)]*\))+/));
            },
            createFunction: function(path, func, signature, RPCProxy) {
                path = 'btapp.' + path + '.' + func;
                var func = function() {
                    var i, args = [];
                    for (i = 0; i < arguments.length; i++) {
                        args.push(arguments[i]);
                    }
                    return RPCCallService.call(path, signature, args, RPCProxy);
                };
                func.valueOf = function() {
                    return 'function' + signatures.substring(4) + ' (returns promise)';
                };
                return func;
            }
        };


        var hookMethods = {
            addEvents: function(data) {
                //console.debug("Add events!", data);
            },
            addRss: function(data) {
                // console.debug("Add RSS!", data);
            },
            addTrackerMethods: function(data) {
                // console.debug("Add Tracker Methods!", data);
            },
            addRsaMethods: function(data) {
                // console.debug("Add RSA Methods!", data);
            },
            addStash: function(data) {
                // console.debug("Add stash!", data);
            },
            addStashMethods: function(data) {
                // console.debug("Add stash methods!", data);
            },
            addEventsMethods: function(data, RPCObject) {
                // console.debug("Add Events methods!", data, RPCObject)
            },
            addRssMethods: function(data, rpc) {
                // console.debug("Add RSS Methods: ", data);
            },
            addBtappMethods: function(data, rpc) {
                // console.debug("Add BTAPP Methods: ", data);
                service.btapp = new RPCObject('btapp', data, rpc);
            },
            addOsMethods: function(data, rpc) {
                service.os = new RPCObject('os', data, rpc);

                // console.debug("Add OS Methods: ", data);
            },
            addAddMethods: function(data, rpc) {
                service.add = new RPCObject('add', data, rpc);
                // console.debug("Add Add Methods: ", data);
            },
            addDhtMethods: function(data) {
                // console.debug("Add DHT Methods: ", data);
            },
            addTorrentMethods: function(data, rpc) {
                service.torrent = new RPCObject('torrent', data, rpc);
                // console.debug("Add Torrent Methods!", data);
            },
            addStream: function(data) {
                // console.debug("Add stream!", data);
            },
            addSettings: function(data, rpc) {
                //console.debug("Add Settings!", data, rpc);
            },
            addSettingsMethods: function(data, rpc) {
                //console.debug("Add Settings methods!", data, rpc, a, b, c);
                service.settings = new RPCObject('settings', data, rpc);
            },
            removeTorrent: function(torrent) {
                var key = Object.keys(torrent)[0];
                if ('hash' in torrent[key]) {
                    Episode.findOneByMagnetHash(torrent[key].hash.toUpperCase()).then(function(result) {
                        if (result) {
                            console.info('remote torrent not found, removed magnetHash[%s] from episode[%s] of series[%s]', result.magnetHash, result.getFormattedEpisode(), result.ID_Serie);
                            result.magnetHash = null;
                            result.Persist();
                        }
                    })
                };
                TorrentHashListService.removeFromHashList(torrent[key].hash.toUpperCase());
                delete service.torrents[torrent[key].hash].hash;
                delete service.eventHandlers[torrent[key].hash];
            },
            /**
             * Incoming torrent detail data, add it to the local cached list
             */
            addTorrent: function(data, RPCProxy) {
                var key = Object.keys(data)[0];
                if (key in service.torrents) {
                    Object.deepMerge(service.torrents[key], data[key]);
                } else {
                    service.torrents[key] = new RPCObject('torrent.all.' + key, data[key], RPCProxy);
                    // //console.debug("Add torrent!", key, this.getTorrentName(data[key]), this.torrents[key], data);
                }
                if (key in service.eventHandlers) {
                    service.eventHandlers[key].map(function(monitorFunc) {
                        monitorFunc(service.torrents[key]);
                    });
                }
                $rootScope.$broadcast('torrent:update:' + key, service.torrents[key]);
                $rootScope.$broadcast('torrent:update:', service.torrents[key]);

            },
        };


        var service = {
            torrents: {},
            settings: {},
            offEvents: {},
            eventHandlers: {},

            getNameFunc: null,

            getTorrentName: function(torrent) {
                if (!service.getNameFunc) {
                    service.getNameFunc = $parse('properties.all.name');
                }
                return (service.getNameFunc(torrent));
            },

            getTorrents: function() {
                var out = [];
                angular.forEach(service.torrents, function(el) {
                    if ('hash' in el) {
                        out.push(el);
                    }
                });
                return out;
            },
            getByHash: function(hash) {
                return (hash in service.torrents) ? service.torrents[hash] : null;
            },


            onTorrentUpdate: function(hash, callback) {
                var key = 'torrent:update:' + hash;
                if (!(key in service.offEvents)) {
                    service.offEvents[key] = [];
                }
                service.offEvents[key].push($rootScope.$on(key, function(evt, torrent) {
                    callback(torrent);
                }));
            },


            offTorrentUpdate: function(hash, callback) {
                var key = 'torrent:update:' + hash;
                if ((key in service.offEvents)) {
                    service.offEvents[key].map(function(dereg) {
                        dereg();
                    });
                }
            },
            handleEvent: function(type, category, data, RPCProxy, input) {
                var func = type + String.capitalize(category);
                if (!(func in hookMethods)) {
                    console.error("Method not implemented: ", func, data);
                } else {
                    hookMethods[func](data, RPCProxy, type, category, input);
                }
            }
        };

        window.bt = service;
        return service;
    }
])

.run(["DuckieTorrent", "uTorrent", "SettingsService",
    function(DuckieTorrent, uTorrent, SettingsService) {
        if (SettingsService.get('torrenting.enabled') && navigator.platform.toLowerCase().indexOf('win') !== -1) {
            // only register uTorrent API on windows platforms #592
            DuckieTorrent.register('uTorrent', uTorrent);
        }
    }
]);
