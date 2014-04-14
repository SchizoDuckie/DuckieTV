angular.module('DuckieTV.providers.chromecast', [])


.factory('ChromeCastSender', function($q) {

    var applicationID = 'B09C392B';
    var namespace = 'urn:x-cast:io.github.schizoduckie.duckietv';
    var session = null;

    /**
     * Incoming event handlers
     */
    var remote = {
        update: function(isAlive) {
            var message = isAlive ? 'Session Updated' : 'Session Removed';
            message += ': ' + session.sessionId;
            console.log(message);
            if (!isAlive) {
                session = null;
            }
        },
        session: function(e) {
            console.log('Received ChromeCast Session ID', e.sessionId, e);
            session = e;
            session.addUpdateListener(remote.update);
            session.addMessageListener(namespace, log.messagereceived);
        },
        receiver: function(e) {
            console.log(e === 'available' ? ["receiver found", e] : "receiver list empty");
        }
    };

    /**
     * Connection event logs
     */
    var log = {
        initSuccess: function(e) {
            console.log("ChromeCast Init Success ", e);
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

        connect: function() {
            var p = $q.defer();
            if (!chrome.cast || !chrome.cast.isAvailable) {
                setTimeout(service.connect, 1000);
            } else {
                var sessionRequest = new chrome.cast.SessionRequest(applicationID);
                var apiConfig = new chrome.cast.ApiConfig(sessionRequest, remote.session, remote.receiver);
                chrome.cast.initialize(apiConfig, function(e) {
                    log.initSuccess(e);
                    p.resolve(e);
                }, log.error);
            }
            return p.promise;
        },

        stop: function() {

        },

        sendMessage: function(message) {
            if (session != null) {
                session.sendMessage(namespace, angular.toJson(message, true), log.successsent, log.error);
            } else {
                chrome.cast.requestSession(function(e) {
                    session = e;
                    session.sendMessage(namespace, angular.toJson(message, true), log.successsent, log.error);
                }, log.error);
            }

        }
    }
    return service;

})

.factory('DuckieTVCast', function(ChromeCastSender, $rootScope) {

    var service = {

        initialize: function() {
            console.log("start initializing");

            ChromeCastSender.connect().then(function() {
                ChromeCastSender.sendMessage({
                    oh: 'hai!'
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

                $rootScope.$on('video:load', function(evt, video) {
                    console.log("Broadcasting episode:load to chromecast video: ", video);
                    ChromeCastSender.sendMessage({
                        'video:load': video
                    });
                });
                console.log("done initializing");
            })

        }

    }
    return service;
})