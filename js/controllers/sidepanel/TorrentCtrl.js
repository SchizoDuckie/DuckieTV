/**
 * Torrent Control for the torrenting window
 */
DuckieTV.controller('TorrentCtrl', ["$rootScope", "DuckieTorrent",
    function($rootScope, DuckieTorrent) {
        var vm = this;
        this.ports = [];
        this.session = false;
        this.authToken = localStorage.getItem('utorrent.token');
        //uTorrent.setPort(localStorage.getItem('utorrent.port'));
        this.rpc = null;
        this.polling = false;
        this.status = 'Connecting';

        this.removeToken = function() {
            localStorage.removeItem("utorrent.token");
            localStorage.removeItem("utorrent.preventconnecting");
            window.location.reload();
        };

        this.getTorrentClientName = function() {
            return DuckieTorrent.getClientName();
        };

        this.getTorrentClientTemplate = function() {
            return DuckieTorrent.getClientName().toLowerCase().replace(/ /g, "").replace(/3.2\+/, "32plus");
        };

        var autoConnectPoll = function() {
            vm.status = 'Connecting...';
            $rootScope.$applyAsync();
            DuckieTorrent.getClient().offline = false;
            DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                vm.status = 'Connected';
                vm.rpc = rpc;
                $rootScope.$applyAsync();
            }, function(err) {
                setTimeout(function() {
                    vm.status = 'Unable to connect. retrying in 5 seconds.';
                    $rootScope.$applyAsync();
                }, 1000);
                $rootScope.$applyAsync();
                console.error("Could not connect, retrying in 5 seconds.", err);
                setTimeout(autoConnectPoll, 5000);
            });
        };

        autoConnectPoll();
    }
]);