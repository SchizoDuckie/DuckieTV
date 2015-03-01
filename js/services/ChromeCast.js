/** 
 * The ChromeCast Sender knows how to send events to the DuckieTV ChromeCast app
 * and connect to the ChromeCast interface.
 */
DuckieTV.factory('ChromeCastSender', ["$q",
    function($q) {

        // Main setup
        var applicationID = 'B09C392B';
        var namespace = 'urn:x-cast:io.github.schizoduckie.duckietv';
        var session = null;

        /**
         * Incoming event handlers
         */
        var remote = {
            // Handle session update messages
            update: function(isAlive) {
                var message = isAlive ? 'Session Updated' : 'Session Removed';
                message += ': ' + session.sessionId;
                console.log(message);
                if (!isAlive) {
                    session = null;
                }
            },
            // Handle new session messages
            session: function(e) {
                console.log('Received ChromeCast Session ID', e.sessionId, e);
                session = e;
                session.addUpdateListener(remote.update);
                session.addMessageListener(namespace, log.messagereceived);
            },
            // Handle when a new receiver is available
            receiver: function(e) {
                console.log(e === 'available' ? ["receiver found", e] : "receiver list empty");
            }
        };

        /**
         * Connection event logs
         */
        var log = {
            initSuccess: function(e, f) {
                console.log("ChromeCast Init Success ", e, f);
            },
            error: function(message) {
                console.log("ChromeCast Error: ", message);
            },
            success: function(message) {
                console.log("ChromeCast Onsuccess: " + message);
            },
            appstopped: function() {
                console.log('ChromeCast App stopped.');
            },
            successsent: function(message) {
                console.log("ChromeCast Message Sent Onsuccess: ", message);
            },
            messagereceived: function(namespace, message) {
                console.log("ChromeCast Message received: ", namespace, message);
            }
        }

        var service = {
            /**  
             * Provide a promise based function that starts connection to the device and
             * resolves when the chromeCast is connected.
             * Calls itself with the original promise after a 1s delay when the chromecast is not ready for action yet.
             */
            connect: function(promise) {
                p = promise || $q.defer();
                if (!chrome.cast || !chrome.cast.isAvailable) {
                    console.log("cast not available yet! delaying by 1second");
                    setTimeout(function() {
                        service.connect(p)
                    }, 1000);
                } else {
                    // Chromecast is available, request a new session with it
                    var sessionRequest = new chrome.cast.SessionRequest(applicationID);
                    var apiConfig = new chrome.cast.ApiConfig(sessionRequest, remote.session, remote.receiver);
                    chrome.cast.initialize(apiConfig, function(e, f) {
                        log.initSuccess(e, f);
                        p.resolve();
                    }, function(e) {
                        console.error("Error connecting to chromecast: ", e);
                        p.reject();
                    });
                }
                return p.promise;
            },
            stop: function() {

            },
            /** 
             * Send a message to the ChromeCast client where it will be processed in the same way
             * as incoming events are handled here.
             */
            sendMessage: function(message) {
                var p = $q.defer();
                // if there is an existing session, send the mesage there.
                if (session != null) {
                    session.sendMessage(namespace, angular.toJson(message, true), function(e) {
                        log.successsent(e);
                        p.resolve();
                    }, function(e) {
                        log.error(e);
                        p.reject();
                    });
                } else {
                    // otherwise, request a new session and send the message afterwards
                    chrome.cast.requestSession(function(e) {
                        session = e;
                        session.sendMessage(namespace, angular.toJson(message, true), function(e) {
                            log.successsent(e);
                            p.resolve();
                        }, function(e) {
                            log.error(e);
                            p.reject(e);
                        });
                    }, function(e) {
                        log.error(e);
                        p.reject(e);
                    });
                }
                return p.promise;
            }
        }
        return service;
    }
])

/** 
 * The DuckieTVCast service is initiated when a chromecast connection is available.
 * It forwards some of the main app-events to the chromecast device so it mirrors on your
 * second screen what you're doing in your browser.
 */
.factory('DuckieTVCast', ["ChromeCastSender", "FavoritesService", "$rootScope", "$q",
    function(ChromeCastSender, FavoritesService, $rootScope, $q) {

        var service = {

            initialize: function() {
                console.log("start initializing");
                var p = $q.defer();
                ChromeCastSender.connect().then(function() {
                    ChromeCastSender.sendMessage({
                        oh: 'hai!'
                    }).then(function() {
                        console.log("Connect message sent, we now have a chromecast connection!");
                        p.resolve();
                    });
                    $rootScope.$on('background:load', function(evt, bg) {
                        ChromeCastSender.sendMessage({
                            'background:load': bg
                        });
                    });
                    $rootScope.$on('serie:load', function(evt, serie) {
                        console.log("Broadcasting serie:load to chromecast: ", serie);
                        ChromeCastSender.sendMessage({
                            'serie:load': serie
                        });
                    });
                    $rootScope.$on('episode:load', function(evt, episode) {
                        console.log("Broadcasting episode:load to chromecast: ", episode);
                        ChromeCastSender.sendMessage({
                            'episode:load': episode
                        });
                    });
                    // Start playing a video on the device. This needs more work.
                    $rootScope.$on('video:load', function(evt, video) {
                        console.log("Broadcasting episode:load to chromecast video: ", video);
                        ChromeCastSender.sendMessage({
                            'video:load': video
                        });
                    });
                    console.log("Chromecast connect started. listening for forwarding events");
                    FavoritesService.loadRandomBackground();
                })
                return p.promise;
            }
        }
        return service;
    }
])