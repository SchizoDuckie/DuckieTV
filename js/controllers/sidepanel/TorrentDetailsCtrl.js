/**
 *
 */
DuckieTV.controller('TorrentDetailsCtrl', ['DuckieTorrent', 'torrent', '$scope', '$injector',
  function(DuckieTorrent, torrent, $scope, $injector) {
    var vm = this

    vm.torrent = torrent
    if ('hash' in torrent && torrent.hash !== undefined) {
      vm.infoHash = torrent.hash.toUpperCase()
    }
    vm.progress = 0
    vm.downloadSpeed = 0
    vm.isWebUI = (vm.torrent instanceof TorrentData) // web or uTorrent?

    /**
         * Closes the SidePanel expansion
         */
    vm.closeSidePanelExpansion = function() {
      $injector.get('SidePanelState').contract()
      $injector.get('$state').go('torrent')
    }

    /**
         * Observes the torrent and watches for changes (progress)
         */
    function observeTorrent(rpc, infoHash) {
      DuckieTorrent.getClient().getRemote().onTorrentUpdate(infoHash, function(newData) {
        vm.torrent = newData
        vm.torrent.getFiles().then(function(files) {
          if (!files) {
            return []
          } else {
            // console.debug('received files!', files);
            vm.torrent.torrent_files = files.map(function(file) {
              file.isMovie = file.name.substring(file.name.length - 3).match(/mp4|avi|mkv|mpeg|mpg|flv|ts/g)
              if (file.isMovie) {
                file.searchFileName = file.name.indexOf('/') > -1 ? file.name.split('/').pop().split(' ').pop() : file.name
                file.path = vm.torrent.getDownloadDir()
              }
              return file
            })
          }
        })
        vm.progress = vm.torrent.getProgress()
        vm.downloadSpeed = Math.floor((vm.torrent.getDownloadSpeed() / 1000) * 10) / 10 // B/s -> kB/s
        vm.isWebUI = (vm.torrent instanceof TorrentData) // web or uTorrent?
        $scope.$applyAsync()
      })
    }

    // If the connected info hash changes, remove the old event and start observing the new one.
    $scope.$watch('infoHash', function(newVal, oldVal) {
      if (newVal == oldVal) return
      vm.infoHash = newVal
      DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
        vm.torrent = DuckieTorrent.getClient().getRemote().getByHash(vm.infoHash)
        DuckieTorrent.getClient().getRemote().offTorrentUpdate(oldVal, observeTorrent)
        observeTorrent(rpc, vm.infoHash)
      })
    })

    /**
         * start monitoring updates for the torrent hash in the infoHash
         */
    DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
      vm.torrent = DuckieTorrent.getClient().getRemote().getByHash(vm.infoHash)
      observeTorrent(rpc, vm.infoHash)
    })
  }
])
