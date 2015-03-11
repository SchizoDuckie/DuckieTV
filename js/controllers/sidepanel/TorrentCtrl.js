/**
 * Torrent Control for the torrenting window
 */
DuckieTV.controller('TorrentCtrl', ["$scope", "$rootScope", "DuckieTorrent", "$q", "DuckieTVCast", "SidePanelState",
    function($scope, $rootScope, DuckieTorrent, $q, DuckieTVCast, SidePanelState) {

        $scope.ports = [];
        $scope.session = false;
        $scope.authToken = localStorage.getItem('utorrent.token');
        //uTorrent.setPort(localStorage.getItem('utorrent.port'));
        $scope.rpc = null;
        $scope.polling = false;

        $scope.isFormatSupported = function(file) {
            return ['p3', 'aac', 'mp4', 'ogg', 'mkv'].indexOf(file.name.split('.').pop()) > -1;
        }

        $scope.playInBrowser = function(torrent) {
            DuckieTVCast.initialize().then(function() {
                $rootScope.$broadcast('video:load', torrent.properties.all.streaming_url.replace('://', '://admin:admin@').replace('127.0.0.1', $rootScope.getSetting('ChromeCast.localIpAddress')));
            })
        }

        $scope.Cast = function() {
            console.log('connecting!');
            DuckieTVCast.initialize();
        }

        $scope.removeToken = function() {
            localStorage.removeItem("utorrent.token");
            localStorage.removeItem("utorrent.preventconnecting");
            window.location.reload();
        }

        $scope.getTorrentClientName = function() {
            return DuckieTorrent.getClientName();
        }

        $scope.localIpAddress = $rootScope.getSetting('ChromeCast.localIpAddress');

        DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
            $scope.rpc = rpc;
        })
    }
])