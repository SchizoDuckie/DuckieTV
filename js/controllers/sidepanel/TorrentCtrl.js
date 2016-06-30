/**
 * Torrent Control for the torrenting window
 */
DuckieTV.controller('TorrentCtrl', ["$rootScope", "$injector", "DuckieTorrent", "SidePanelState",
    function($rootScope, $injector, DuckieTorrent, SidePanelState) {
        var vm = this;
        
        this.authToken = localStorage.getItem('utorrent.token');
        //uTorrent.setPort(localStorage.getItem('utorrent.port'));
        this.rpc = null;
        this.status = 'Connecting';

        this.removeToken = function() {
            localStorage.removeItem("utorrent.token");
            localStorage.removeItem("utorrent.preventconnecting");
            $injector.get('DuckietvReload').windowLocationReload();
        };

        this.getTorrentClientName = function() {
            return DuckieTorrent.getClientName();
        };

        this.getTorrentClientTemplate = function() {
            return DuckieTorrent.getClientName().toLowerCase().replace(/ /g, "").replace("(pre3.2)", "Pre32").replace(/3.2\+/, "32plus");
        };

        this.getTorrentsCount = function() {
            if (vm.rpc) {
                var count = vm.rpc.getTorrents().length;
                if (SidePanelState.state.isExpanded && count === 0) {
                    setTimeout(function() {
                            if (document.getElementById('getTorrentsCount') && document.getElementById('getTorrentsCount').offsetParent !== null) {
                                SidePanelState.contract();
                            }
                    }, 1000);
                };
                return count;
            } else {
                return 0;
            }
        };

        var autoConnectPoll = function() {
            vm.status = 'Connecting...';
            $rootScope.$applyAsync();
            DuckieTorrent.getClient().offline = false;
            DuckieTorrent.getClient().AutoConnect().then(function(rpc) {
                vm.status = 'Connected';
                vm.rpc = rpc;
                $rootScope.$applyAsync();
            });
        };

        $rootScope.$on('torrentclient:connected', function(remote) {
            autoConnectPoll();
        });

        autoConnectPoll();
    }
]);