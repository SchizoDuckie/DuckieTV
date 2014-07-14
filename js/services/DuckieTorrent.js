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
 * local state (stored in the TorrentRemote service)
 *
 */
angular.module('DuckieTorrent.torrent', [])
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
         * Automated parser for responses for usage when neccesary
         */
        this.getParser = function(type) {
            return (type in this.parsers) ? this.parsers[type] : function(data) {
                return data.data
            };
        }

        /**
         * Fetches the url, auto-replaces the port in the url if it was found.
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

        this.$get = function($q, $http, URLBuilder, $parse, TorrentRemote) {
            var self = this;

            /**
             * Build a JSONP request using the URLBuilder service.
             * Automagically adds the JSON_CALLBACK option and executes the built in parser, or returns the result
             * @param string type url to fetch from the request types
             * @param object params GET parameters
             * @param object options $http optional options
             */
            var jsonp = function(type, params, options) {
                var d = $q.defer();
                params = angular.extend(params || {}, {
                    callback: 'JSON_CALLBACK'
                });
                var url = URLBuilder.build(self.getUrl(type), params);
                var parser = self.getParser(type);
                $http.jsonp(url, options || {}).then(function(response) {
                    d.resolve(parser ? parser(response) : response.data);
                }, function(err) {
                    console.log('error fetching', type);
                    d.reject(err);
                });
                return d.promise;
            }


            var methods = {
                /**
                 * Execute a portscan on one of the 20 ports that were generated with the algorthm, stop scanning when a response is found.
                 * Sets the found port index in self.currentPort;
                 */
                portScan: function(ports) {
                    var d = $q.defer();

                    var nextPort = function() {
                        self.port = ports[self.currentPort];
                        jsonp('version').then(function(result) {
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
                    }
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
                        name: 'DuckieTV on ' + navigator.userAgent.match(/Chrome\/([0-9\.]+)/)[0]
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
                            }
                        });
                        return p.promise;
                    }
                    return jsonp('api', {
                        pairing: authToken,
                        type: 'state',
                        queries: '[["btapp"]]',
                        hostname: window.location.host
                    }).then(function(session) {
                        console.log("Retreived session key!", session);
                       self.sessionKey = session.session;
                        self.authToken = authToken;
                        self.connected = true;
                        return session;
                    }, function(fail) {
                        console.error("Error starting session with auth token %s!", authToken);
                    });
                },
                /** 
                 * Execute and handle the api's 'update' query.
                 * Parses out the events, updates, properties and methods and dispatches them to the TorrentRemote interface
                 * for storage, handling and attaching RPC methods.
                 */
                statusQuery: function() {
                    return jsonp('api', {
                        pairing: self.authToken,
                        session: self.sessionKey,
                        type: 'update',
                        hostname: window.location.host
                    }).then(function(data) {
                    	if(data == "invalid request") {
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
                                data = 'all' in el[type].btapp[category] ? el[type].btapp[category].all : el[type].btapp[category];
                                if (!('all' in el[type].btapp[category])) category += 'Methods';
                            }
                            TorrentRemote.handleEvent(type, category, data, methods.RPC);
                        });
                        return data;
                    }, function(error) {
                        console.error("Error executing get status query!", error);
                    })
                },
                /**
                 * Return the interface that handles the remote data.
                 */
                getRemote: function() {
                    return TorrentRemote;
                },
                /** 
                 * Execute a remote procedure function.
                 * This function is passed all the way from here to the actual RPCObject's function.
                 */
                RPC: function(path, args) {
                    p = path.split('.');
                    console.debug("Path:", p);;
                    if (!args) args = [];
                    return jsonp('api', {
                        pairing: self.authToken,
                        session: self.sessionKey,
                        type: 'function',
                        path: [p],
                        'args': '[]',
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
                 * Execute a portscan on any of the 20 ports that are generated by the get_port api until one works.
                 * If it works, store it in uTorrent.port
                 */
                Scan: function() {
                    var p = $q.defer();
                    var ports = [];
                    for (var i = 0; i < 20; i++) {
                        ports.push(7 * Math.pow(i, 3) + 3 * Math.pow(i, 2) + 5 * i + 10000);
                    }
                    methods.portScan(ports).then(function(result) {
                        console.log("Ping result on port", result);
                        localStorage.setItem('utorrent.port', result.port);
                        methods.setPort(result.port);
                        p.resolve(result.port);
                    }, function(err) {
                        console.error('Could not connect to one of the ports!');
                    });
                    return p.promise;
                },

                /**
                 * Connect with an auth token obtained by the Pair function.
                 * Store the resulting session key in $scope.session
                 */
                AutoConnect: function() {
                    if (!self.isConnecting && !self.connected) {
                        self.connectPromise = $q.defer();
                        self.isConnecting = true;
                    } else {
                        if (!self.connected) {
                            return self.connectPromise.promise;
                        } else {
                            var p = $q.defer();
                            p.resolve(methods.getRemote());
                            return p.promise;
                        }
                    }

                    if (!localStorage.getItem('utorrent.preventconnecting') && !localStorage.getItem('utorrent.token')) {
                        methods.Scan().then(function() {
                            methods.Pair().then(function() {
                                methods.connect(localStorage.getItem('utorrent.token')).then(function(result) {
                                    if (!self.isPolling) {
                                        self.isPolling = true;
                                        methods.Update();
                                    }
                                    self.isConnecting = false;
                                    self.connectPromise.resolve(methods.getRemote());
                                });
                            }, function(error) {
                            	if (error == "PAIR_DENIED" && confirm("You denied the uTorrent/BitTorrent Client request. \r\nDo you wish to prevent any future connection attempt?")) {
                            		localStorage.setItem('utorrent.preventconnecting', true);
                            	}
                            });
                        });
                    } else {
                    	if(!localStorage.getItem('utorrent.preventconnecting')) {
	                        methods.Scan().then(function() {
	                            methods.connect(localStorage.getItem('utorrent.token')).then(function(result) {
	                                if (!self.isPolling) {
	                                    self.isPolling = true;
	                                    methods.Update();
	                                }
	                                self.isConnecting = false;
	                                self.connectPromise.resolve(methods.getRemote());
	                            });
	                        })
                        }
                    }

                    return self.connectPromise.promise;
                },

                /**
                 * Execute a pair promise against utorrent
                 * It waits 30 seconds for the promise to timeout.
                 * When it works, it stores the returned auth token for connecting with the Connect function
                 */
                Pair: function() {
                    return methods.pair().then(function(result) {
                        console.log("Received auth token!", result);
                        var key = typeof result == 'object' ? result.pairing_key : result; // switch between 3.3.x and 3.4.1 build 31206 pairing method
                        if(key == '<NULL>') {
                        	throw "PAIR_DENIED";
                        } else {
	                        localStorage.setItem('utorrent.token', key);
	                        self.authToken = result; // .pairing_key;
                        }
                    }, function(err) {
                        console.error("Eror pairing!", err);
                    })
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
                Update: function() {
                    if (self.isPolling == true) {
                        methods.statusQuery().then(function(data) {
                            if (self.isPolling && !data.error) {
                             setTimeout(methods.Update, data && data.length == 0 ? 3000 : 0); // burst when more data comes in, delay when things ease up.
                        	}
                        });
                    }
                },
                isConnected: function() {
                    return self.connected;
                }

            };
            return methods;
        }
    })
/**
 * Some RPC Call validation methods taken mostly directly from btapp.js
 * Converted to plain angular / javascript to keep this dependency-free
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
                    } else if (typeof variables[index] === 'null') {
                        return true;
                    }

                    switch (type) {
                        //Most of these types that the client sends up match the typeof values of the javascript
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
            console.log("Create a callback function for ", cb);
            cb = cb || function() {};
            var str = 'bt_' + new Date().getTime();
            this.btappCallbacks[str] = cb;
            return str;
        },

        call: function(path, signature, args, rpcTarget) {
            console.log("Trying to call RPC function: ", path, signature, args);
            // This is as close to a static class function as you can get in javascript i guess
            // we should be able to use verifySignaturesArguments to determine if the client will
            // consider the arguments that we're passing to be valid
            if (!service.validateArguments.call(service, signature, args)) {
                console.error("Arguments do not match signature!", args, signature, path);
                throw 'arguments do not match any of the function signatures exposed by the client';
            }
            service.convertCallbackFunctionArgs(args);
            console.log("Calling RPC Function!", path, signature, args);
            return rpcTarget(path, args);

        }
    };

    return service;
})
/**
 * uTorrent/Bittorrent remote singleton that receives the incoming data
 */
.factory('TorrentRemote', function($parse, $rootScope, RPCCallService) {

    /**
     * RPC Object that wraps the remote data that comes in from uTorrent.
     * It stores all regular properties on itself
     * and makes sure that the remote function signatures are verified (using some code borrowed from the original btapp.js)
     * and a dispatching function with the matching signature is created and mapped to the RPCCallService
     * (to keep the overhead of creating many rpc call functions as low as possible)
     */
    var RPCObject = function(path, data, RPCProxy) {
        var callbacks = {};

        for (var property in data) {
            this[property] = this.isRPCFunctionSignature(data[property]) ? this.createFunction(path, property, data[property], RPCProxy) : data[property];
        };
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
            }
            if (!(this.properties.all.status in statuses)) {
                console.error("There's an unknown status for this torrent!", this.properties.all.status, this);
                return this.properties.all.status;
            }
            return statuses[this.properties.all.status];
        },

        getStarted: function() {
            return $parse('properties.all.added_on')(this);
        },

        getProgress: function() {
            var pr = $parse('properties.all.progress')(this);
            return pr ? pr / 10 : pr;
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
            return files;
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
            }
            func.valueOf = function() {
                return 'function' + signatures.substring(4) + ' (returns promise)'
            };
            return func;
        }

    };
    var service = {
        torrents: {},
        settings: {},
        getNameFunc: null,

        getTorrentName: function(torrent) {
            if (!service.getNameFunc) {
                service.getNameFunc = $parse('properties.all.name');
            }
            return (service.getNameFunc(torrent))
        },

        removeTorrent: function(torrent) {
            this.torrents[torrent.hash] = null;
            delete this.torrents[torrent.hash];
        },

        addEvent: function(torrent) {
            // console.log("Add to list: ", torrent);
            this.torrents[torrent.hash] = torrent;
        },

        removeEvent: function(torrent) {
            console.log("Remove from list: ", torrent);
            //delete this.torrents[torrent.hash];
        },

        addSettings: function(data) {
            // console.log("Add Settings!", data);
        },

        getTorrents: function() {
            var out = [];
            angular.forEach(service.torrents, function(el) {
                out.push(el);
            })
            return out;
        },
        getByHash: function(hash) {
            return (hash in service.torrents) ? service.torrents[hash] : null;
        },

        addTorrent: function(data, RPCProxy) {
            var key = Object.keys(data)[0];
            if (key in this.torrents) {
                Object.deepMerge(this.torrents[key], data[key]);
            } else {
                this.torrents[key] = new RPCObject('torrent.all.' + key, data[key], RPCProxy);
                // //console.log("Add torrent!", key, this.getTorrentName(data[key]), this.torrents[key], data);
            }
            $rootScope.$broadcast('torrent:update:' + key, this.torrents[key]);
        },

        addEvents: function(data) {
            console.info("Add events!", data);
        },

        addRss: function(data) {
            // console.log("Add RSS!", data);

        },

        addTrackerMethods: function(data) {
            // console.log("Add Tracker Methods!", data);
        },

        addRsaMethods: function(data) {
            // console.log("Add RSA Methods!", data);
        },

        addStash: function(data) {
            // console.log("Add stash!", data);
        },

        addStashMethods: function(data) {
            // console.log("Add stash methods!", data);
        },


        addRssMethods: function(data) {
            // console.log("Add RSS Methods: ", data);
        },

        addBtappMethods: function(data) {
            // console.log("Add BTAPP Methods: ", data);

        },

        addOsMethods: function(data) {
            // console.log("Add BTAPP Methods: ", data);

        },

        addAddMethods: function(data) {
            // console.log("Add Add Methods: ", data);
        },

        addDhtMethods: function(data) {
            // console.log("Add DHT Methods: ", data);
        },

        addTorrentMethods: function(data) {
            // console.log("Add Torrent Methods!", data);
        },

        addStream: function(data) {
            // console.log("Add stream!", data);
        },

        handleEvent: function(type, category, data, RPCProxy) {
            if (!(type + String.capitalize(category) in this)) {
                console.error("Method not implemented: " + type + category.capitalize(), data);
            } else {
                this[type + String.capitalize(category)](data, RPCProxy);
            }
        }


    };
    return service;
})

/**
 * Angular's private URL Builder method + unpublished dependencies converted to a public service
 * So we can properly build a GET url with parameters for a JSONP request.
 */
.provider('URLBuilder', function() {

    function encodeUriQuery(val, pctEncodeSpaces) {
        return encodeURIComponent(val).
        replace(/%40/gi, '@').
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
    }

    /**
     * Angular's private buildUrl function, patched to refer to the public methods on the angular globals
     */
    function buildUrl(url, params) {
        if (!params) return url;
        var parts = [];
        angular.forEach(params, function(value, key) {
            if (value === null || angular.isUndefined(value)) return;
            if (!angular.isArray(value)) value = [value];

            angular.forEach(value, function(v) {
                if (angular.isObject(v)) {
                    v = angular.toJson(v);
                }
                parts.push(encodeUriQuery(key) + '=' +
                    encodeUriQuery(v));
            });
        });
        return url + ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
    }

    this.$get = function() {
        return {
            build: function(url, params) {
                return buildUrl(url, params);
            }
        }

    }
})

.directive('torrentRemoteControl', function(TorrentRemote, uTorrent, DuckieTVCast, $rootScope) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        scope: {
            infoHash: '=infoHash',
            templateUrl: '=templateUrl'
        },
        templateUrl: function($node, $iAttrs) {
            return $iAttrs.templateUrl || "templates/torrentRemoteControl.html"
        },
        link: function($scope, $attr) {
            // if the connected info hash changes, remove the old event and start observing the new one.
            $scope.$watch('infoHash', function(newVal, oldVal) {
                if (newVal == oldVal) return;
                $rootScope.$$listeners['torrent:update:' + oldVal] = []; // no $rootScope.$off?
                $scope.infoHash = newVal;
                observeTorrent(newVal);
            });

            function observeTorrent(infoHash) {
                $rootScope.$on('torrent:update:' + $scope.infoHash, function(evt, data) {
                    $scope.torrent = data;
                    if ($scope.$root.getSetting('torrenting.autostop') && $scope.torrent.isStarted() && $scope.torrent.getProgress() == 100) {
                        console.log('Torrent finished. Auto-stopping', $scope.torrent);
                        $scope.torrent.stop();
                    }
                });
                $scope.torrent = TorrentRemote.getByHash($scope.infoHash);
            }
            uTorrent.AutoConnect().then(function(remote) {
                observeTorrent($scope.infoHash);
            }, function(fail) {
            	console.log("Failed! to connect!");
            });

            $scope.isFormatSupported = function(file) {
                return ['p3', 'aac', 'mp4', 'ogg', 'mkv'].indexOf(file.name.split('.').pop()) > -1;
            }

            $scope.playInBrowser = function(torrent) {
                $rootScope.$broadcast('video:load', torrent.properties.all.streaming_url.replace('://', '://admin:admin@').replace('127.0.0.1', $rootScope.getSetting('ChromeCast.localIpAddress')));
            }

            function get_port(i) {
                return 7 * Math.pow(i, 3) + 3 * Math.pow(i, 2) + 5 * i + 10000;
            }

            $scope.Cast = function() {
                console.log('connecting!');
                DuckieTVCast.initialize();
            }

        }
    }

});


String.capitalize = function(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Simple recursive object merge that merges everyting from obj2 into obj1 and recurses until it can't go any deeper.
 */
Object.deepMerge = function(obj1, obj2) {
    for (i in obj2) { // add the remaining properties from object 2
        if (typeof obj2[i] !== 'object' && typeof obj2[i] !== 'array') {
            obj1[i] = obj2[i];
        } else {
            obj1[i] = Object.deepMerge(i in obj1 ? obj1[i] : {}, obj2[i]);
        }
    }
    return obj1;
}