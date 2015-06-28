DuckieTV
/**
 * Torrent Remote Control Directive
 */
.directive('torrentRemoteControl', ["DuckieTorrent", "$rootScope",
    function(DuckieTorrent, $rootScope) {
        return {
            restrict: 'E',
            transclude: true,
            replace: false,
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
                        if (newVal == oldVal) return;
                        remote.infoHash = newVal;
                        DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                            remote.torrent = DuckieTorrent.getClient().getRemote().getByHash(remote.infoHash);
                            DuckieTorrent.getClient().getRemote().offTorrentUpdate(oldVal, observeTorrent);
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

                    $scope.removeHash = function() {
                        Episode.findOneByMagnetHash(remote.magnetHash).then(function(result) {
                            if (result) {
                                result.magnetHash = null;
                                result.Persist();
                            }
                        });
                    };

                }
            ]
        };

    }
]);