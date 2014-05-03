angular.module('DuckieTorrent.controllers', ['DuckieTorrent.torrent', 'DuckieTV.providers.chromecast'])


.controller('TorrentCtrl',
    function($scope, $rootScope, uTorrent, $q, DuckieTVCast) {
        $scope.ports = [];
        $scope.statusLog = [];
        $scope.session = false;
        $scope.authToken = localStorage.getItem('utorrent.token')
        uTorrent.setPort(localStorage.getItem('utorrent.port'));
        $scope.rpc = null;
        $scope.polling = false;
        /**
         * A btapp api runs on one of these ports
         */

        $scope.isFormatSupported = function(file) {
            return ['p3', 'aac', 'mp4', 'ogg', 'mkv'].indexOf(file.name.split('.').pop()) > -1;
        }

        $scope.playInBrowser = function(torrent) {
            $rootScope.$broadcast('video:load', torrent.properties.all.streaming_url.replace('://', '://admin:admin@').replace('127.0.0.1', $rootScope.getSetting('ChromeCast.localIpAddress')));
        }

        function get_port(i) {
            return 7 * Math.pow(i, 3) + 3 * Math.pow(i, 2) + 5 * i + 10000;
        }

        $scope.AutoConnect = function() {
            uTorrent.AutoConnect().then(function(rpc) {
                $scope.rpc = rpc;
            })
        }

        $scope.togglePolling = function() {
            $scope.polling = !$scope.polling;
            $scope.Update();
        }
        /**
         * Start the status update polling.
         * Stores the resulting TorrentClient service in $scope.rpc
         * Starts polling every 1s.
         */
        $scope.Update = function() {
            if ($scope.polling == true) {
                uTorrent.statusQuery().then(function(data) {
                    if ($scope.polling) setTimeout($scope.Update, data.length == 0 ? 3000 : 0); // burst when more data comes in, delay when things ease up.
                });
            }
        }


        $scope.localIpAddress = $rootScope.getSetting('ChromeCast.localIpAddress');



    })




function go() {
    enumLocalIPs(function(localIp) {
        document.getElementById('localips').innerHTML += localIp + '<br>';
    });
}