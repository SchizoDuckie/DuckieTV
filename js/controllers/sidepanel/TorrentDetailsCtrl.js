/**
 *
 */
DuckieTV.controller('TorrentDetailsCtrl', ["DuckieTorrent", "torrent", "$scope", "$injector",
    function(DuckieTorrent, torrent, $scope, $injector) {
        var self = this;

        this.torrent = torrent;
        if ('hash' in torrent && torrent.hash !== undefined) {
            this.infoHash = torrent.hash.toUpperCase();
        };
        this.progress = 0;
        this.downloadSpeed = 0;
        this.isWebUI = (this.torrent instanceof TorrentData); // web or uTorrent?

        /**
         * Closes the SidePanel expansion
         */
        this.closeSidePanelExpansion = function() {
            $injector.get('SidePanelState').contract();
             $injector.get('$state').go('torrent');
        }

        /**
         * Observes the torrent and watches for changes (progress)
         */
        function observeTorrent(rpc, infoHash) {
            DuckieTorrent.getClient().getRemote().onTorrentUpdate(infoHash, function(newData) {
                self.torrent = newData;
                self.torrent.getFiles().then(function(files) {
                    if (!files) {
                        return [];
                    } else {
                        //console.debug('received files!', files);
                        self.torrent.torrent_files = files.map(function(file) {
                            file.isMovie = file.name.substring(file.name.length - 3).match(/mp4|avi|mkv|mpeg|mpg|flv|ts/g);
                            if (file.isMovie) {
                                file.searchFileName = file.name.indexOf('/') > -1 ? file.name.split('/').pop().split(' ').pop() : file.name;
                                file.path = self.torrent.getDownloadDir();
                            }
                            return file;
                        });
                    }
                });
                self.progress = self.torrent.getProgress();
                self.downloadSpeed = Math.floor((self.torrent.getDownloadSpeed() / 1000) * 10) / 10; // B/s -> kB/s
                self.isWebUI = (self.torrent instanceof TorrentData); // web or uTorrent?
                $scope.$applyAsync();
            });
        }

        // If the connected info hash changes, remove the old event and start observing the new one.
        $scope.$watch('infoHash', function(newVal, oldVal) {
            if (newVal == oldVal) return;
            self.infoHash = newVal;
            DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                self.torrent = DuckieTorrent.getClient().getRemote().getByHash(self.infoHash);
                DuckieTorrent.getClient().getRemote().offTorrentUpdate(oldVal, observeTorrent);
                observeTorrent(rpc, self.infoHash);
            });
        });

        /**
         * start monitoring updates for the torrent hash in the infoHash
         */
        DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
            self.torrent = DuckieTorrent.getClient().getRemote().getByHash(self.infoHash);
            observeTorrent(rpc, self.infoHash);
        });

    }
]);