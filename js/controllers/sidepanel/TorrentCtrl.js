/**
 * Torrent Control for the torrenting window
 */
DuckieTV.controller('TorrentCtrl', ["$scope", "$rootScope", "DuckieTorrent", "$q", "SidePanelState",
    function($scope, $rootScope, DuckieTorrent, $q, SidePanelState) {

        $scope.ports = [];
        $scope.session = false;
        $scope.authToken = localStorage.getItem('utorrent.token');
        //uTorrent.setPort(localStorage.getItem('utorrent.port'));
        $scope.rpc = null;
        $scope.polling = false;
        $scope.status = 'Connecting';

        $scope.removeToken = function() {
            localStorage.removeItem("utorrent.token");
            localStorage.removeItem("utorrent.preventconnecting");
            window.location.reload();
        };

        $scope.getTorrentClientName = function() {
            return DuckieTorrent.getClientName();
        };

        $scope.getFiles = function(torrent) {
            torrent.getFiles().then(function(files) {
                console.log('received files!',
                    files);
                torrent.files = files.map(function(file) {
                    file.isMovie = file.name.match(/mp4|avi|mkv|mpeg|mpg|flv/g);
                    if (file.isMovie) {
                        file.searchFileName = file.name.split('/').pop().split(' ').pop();
                    }
                    return file;
                });
            });
        };

        var autoConnectPoll = function() {
            $scope.status = 'Connecting...';
            $scope.$applyAsync();
            DuckieTorrent.getClient().offline = false;
            DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                $scope.status = 'Connected';
                $scope.rpc = rpc;
                $scope.$applyAsync();
            }, function(err) {
                setTimeout(function() {
                    $scope.status = 'Unable to connect. retrying in 5 seconds.';
                    $scope.$applyAsync();
                }, 1000);
                $scope.$applyAsync();
                console.error("Could not connect, retrying in 5 seconds.", err);
                setTimeout(autoConnectPoll, 5000);
            });
        };

        autoConnectPoll();
    }
]);