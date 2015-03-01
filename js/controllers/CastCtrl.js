/**
 * ChromeCast controller. Can fire off ChromeCast initializer
 */
DuckieTV.controller('ChromeCastCtrl', ["$scope", "DuckieTVCast", "$q", "$rootScope",
    function($scope, DuckieTVCast, $q, $rootScope) {

        $scope.addrs = {};
        $scope.localIpAddress = $rootScope.getSetting('ChromeCast.localIpAddress');

        discoverLocalIP = function() {
            console.log("Discovering local IP Address via RTC Peer Connnection");
            var p = $q.defer();

            var RTCPeerConnection = window.webkitRTCPeerConnection;

            var rtc = new RTCPeerConnection({
                iceServers: []
            });
            if (window.mozRTCPeerConnection) rtc.createDataChannel('', {
                reliable: false
            });

            function grepSDP(sdp) {
                sdp.split('\r\n').map(function(line) {
                    if (~line.indexOf('a=candidate')) {
                        var parts = line.split(' '),
                            addr = parts[4],
                            type = parts[7];
                        if (type === 'host') $scope.addrs[addr] = true;
                    }
                });
            }

            rtc.onicecandidate = function(evt) {
                if (evt.candidate) {
                    grepSDP(evt.candidate.candidate);
                }
            }

            rtc.createOffer(function(desc) {
                rtc.setLocalDescription(desc)
            }, function(e) {});

            setTimeout(function() {
                p.resolve(Object.keys($scope.addrs));
            }, 1500);

            return p.promise;

        }

        $scope.getLocalIP = function() {
            discoverLocalIP().then(function(result) {
                console.debug("Local IP Address: ", result);
                $scope.localIpAddresses = result;
            });
        };

        $scope.setStreamingSource = function(address) {
            $rootScope.setSetting('ChromeCast.localIpAddress', address);
            $scope.localIpAddress = address;
        }

        $scope.Cast = function() {
            console.log('connecting!');
            DuckieTVCast.initialize();
        }

        $scope.getLocalIP();
    }
]);

// delay loading of chromecast because it's creating a load delay in the rest of the scripts.
if ('chrome' in window && navigator.vendor.indexOf('Google') > -1) {
    setTimeout(function() {
        var s = document.createElement('script');
        s.src = './js/vendor/cast_sender.js';
        document.body.appendChild(s);
    }, 5000);
}