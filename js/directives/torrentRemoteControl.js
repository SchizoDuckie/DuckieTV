DuckieTV
/**
 * Torrent Remote Control Directive
 */
  .directive('torrentRemoteControl', ['DuckieTorrent', 'TorrentHashListService',
    function(DuckieTorrent, TorrentHashListService) {
      return {
        restrict: 'E',
        transclude: true,
        replace: false,
        scope: {
          infoHash: '=infoHash',
          templateUrl: '=templateUrl',
          episodeDownloaded: '=downloaded'
        },
        templateUrl: function($node, $iAttrs) {
          return $iAttrs.templateUrl
        },
        controllerAs: 'remote',
        controller: ['$scope', '$rootScope',
          function($scope, $rootScope) {
            var remote = this
            remote.infoHash = $scope.infoHash
            remote.torrent = null
            remote.isConnected = false
            var disposeTorrentUpdate = angular.noop
            var disposeConnectedListener = angular.noop
            var destroyed = false

            this.getFiles = function(torrent) {
              remote.torrent.getFiles().then(function(files) {
                remote.torrent_files = files.map(function(file) {
                  file.isMovie = file.name.substring(file.name.length - 3).match(/mp4|avi|mkv|mpeg|mpg|flv|ts/g)
                  if (file.isMovie) {
                    file.searchFileName = file.name.split('/').pop().split(' ').pop()
                  }
                  return file
                })
              })
            }

            /**
                     * Observes the torrent and watches for changes (progress)
                     */
            function observeTorrent(rpc, infoHash) {
              disposeTorrentUpdate()
              disposeTorrentUpdate = DuckieTorrent.getClient().getRemote().onTorrentUpdate(infoHash, function(newData) {
                remote.torrent = newData
                $scope.$applyAsync()
              })
            }

            // If the connected info hash changes, replace the old subscription.
            $scope.$watch('infoHash', function(newVal, oldVal) {
              if (newVal == oldVal) return
              remote.infoHash = newVal
              DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                if (destroyed || newVal !== remote.infoHash) return
                remote.torrent = DuckieTorrent.getClient().getRemote().getByHash(remote.infoHash)
                observeTorrent(rpc, remote.infoHash)
              })
            })

            $scope.$on('$destroy', function() {
              destroyed = true
              disposeTorrentUpdate()
              disposeConnectedListener()
            })

            /**
                     * Auto connect and wait for initialisation, then start monitoring updates for the torrent hash in the infoHash
                     */
            DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
              if (destroyed) return
              remote.isConnected = true
              remote.torrent = DuckieTorrent.getClient().getRemote().getByHash(remote.infoHash)
              observeTorrent(rpc, remote.infoHash)
              if (DuckieTorrent.getClient().getName() === 'uTorrent') {
                remote.cleanupHashCheck()
              }
            }, function(fail) {
              // Failed to connect to torrent client for monitoring. Creating an event watcher for when torrent client is connected.
              if (destroyed) return
              disposeConnectedListener = $rootScope.$on('torrentclient:connected', function(rpc) {
                if (destroyed) return
                remote.isConnected = true
                remote.torrent = DuckieTorrent.getClient().getRemote().getByHash(remote.infoHash)
                observeTorrent(rpc, remote.infoHash)
                if (DuckieTorrent.getClient().getName() === 'uTorrent') {
                  remote.cleanupHashCheck()
                }
              })
            })

            this.cleanupHashCheck = function() {
              /**
                         * clean up when torrent has not been found in torrent-client
                         * exception: when using launch_via_chromium, only do the check when the torrent has downloaded
                         * otherwise we could delete DuckieTV's infoHash before the user has completed the add-new-torrent dialogue on the TorrentHost
                        **/
              setTimeout(function() {
                var lvc = $rootScope.getSetting('torrenting.launch_via_chromium')
                if ((!lvc) || (lvc && $scope.episodeDownloaded)) {
                  DuckieTorrent.getClient().hasTorrent(remote.infoHash).then(function(hasTorrent) {
                    if (!hasTorrent) {
                      TorrentHashListService.removeFromHashList(remote.infoHash)
                      Episode.findOneByMagnetHash(remote.infoHash).then(function(result) {
                        if (result) {
                          console.info('remote torrent not found, removed magnetHash[%s] from episode[%s] of series[%s]', result.magnetHash, result.getFormattedEpisode(), result.ID_Serie)
                          result.magnetHash = null
                          result.Persist()
                        }
                      })
                    }
                  })
                }
              }, 5000)
            }
          }
        ]
      }
    }
  ])
