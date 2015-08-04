/**
 *
 */
DuckieTV
    .controller('TorrentDetailsCtrl', ["DuckieTorrent", "torrent", "$scope",
        function(DuckieTorrent, torrent, $scope) {
            var self = this;

            this.torrent = torrent;

            this.progress = 0;
            this.transferSpeed = 0;



            if (torrent instanceof TorrentData) {
                $scope.$watch("torrent.getProgress()", function(newValue) {
                    self.progress = torrent.getProgress();
                });

                $scope.$watch("torrent.getTransferSpeed()", function(newValue) {
                    self.transferSpeed = torrent.getTransferSpeed();
                });
                torrent.getFiles().then(function(files) {
                    console.log('received files!', files);
                    torrent.torrent_files = files.map(function(file) {
                        file.isMovie = file.name.match(/mp4|avi|mkv|mpeg|mpg|flv/g);
                        if (file.isMovie) {
                            file.searchFileName = file.name.split('/').pop().split(' ').pop();
                        }
                        return file;
                    });
                });
            }

        }
    ]);