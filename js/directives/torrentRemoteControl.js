DuckieTV
/**
 * Torrent Remote Control Directive
 */
.directive('torrentRemoteControl', ["DuckieTorrent", "DuckieTVCast", "$rootScope",
    function(DuckieTorrent, DuckieTVCast, $rootScope) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                infoHash: '=infoHash',
                templateUrl: '=templateUrl'
            },
            templateUrl: function($node, $iAttrs) {
                return $iAttrs.templateUrl || "templates/torrentRemoteControl.html";
            },
            controllerAs: 'remote',
            controller: ["$scope", "$rootScope",
                function($scope, $rootScope) {

                    var remote = this;
                    remote.infoHash = $scope.infoHash;
                    remote.torrent = null;

                    /**
                     * Observes the torrent and watches for changes (progress)
                     */
                    function observeTorrent(rpc, infoHash) {
                        DuckieTorrent.getClient().getRemote().onTorrentUpdate(infoHash, function(newData) {
                            remote.torrent = newData;
                        });
                    }

                    // If the connected info hash changes, remove the old event and start observing the new one.
                    $scope.$watch('infoHash', function(newVal, oldVal) {
                        DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                            if (newVal == oldVal) return;
                            remote.infoHash = newVal;
                            remote.torrent = TorrentRemote.getByHash(remote.infoHash);
                            DuckieTorrent.getClient().offTorrentUpdate(oldVal, observeTorrent);
                            observeTorrent(rpc, remote.infoHash);
                        });
                    });

                    /**
                     * Autoconnect and wait for initialisation, then start monitoring updates for the torrent hash in the infoHash
                     */
                    DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                        remote.torrent = DuckieTorrent.getClient().getRemote().getByHash(remote.infoHash);
                        observeTorrent(rpc, remote.infoHash);
                    }, function(fail) {
                        console.log("Failed to connect connect to torrent client for monitoring!");
                    });

                    $scope.isFormatSupported = function(file) {
                        return ['p3', 'aac', 'mp4', 'ogg', 'mkv'].indexOf(file.name.split('.').pop()) > -1;
                    };

                    $scope.playInBrowser = function(torrent) {
                        $rootScope.$broadcast('video:load', torrent.properties.all.streaming_url.replace('://', '://admin:admin@').replace('127.0.0.1', $rootScope.getSetting('ChromeCast.localIpAddress')));
                    };


                    $scope.Cast = function() {
                        console.log('connecting!');
                        DuckieTVCast.initialize();
                    };
                }
            ]
        };

    }
]);