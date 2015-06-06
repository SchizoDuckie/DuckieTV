/**
 * Actionbar Controller
 */

DuckieTV.controller('ActionBarCtrl', ["$rootScope", "$state", "$filter", "SeriesListState", "SidePanelState", "DuckieTorrent",
    function($rootScope, $state, $filter, SeriesListState, SidePanelState, DuckieTorrent) {

        this.hidePanels = function() {
            SeriesListState.hide();
            SidePanelState.hide();
        };

        this.toggleSeriesList = function() {
            SeriesListState.toggle();
        };

        this.contractSidePanel = function() {
            SidePanelState.show();
            SidePanelState.contract();
        };

        this.hideSidePanel = function() {
            SidePanelState.hide();
        };

        this.showSidePanel = function() {
            setTimeout(function() { // i have no idea why, but transitioning from serieslist to settings doesnt work otherwise.
                SidePanelState.show();
            }, 500);
        };

        this.expandSidePanel = function() {
            SidePanelState.expand();
        };

        this.resetCalendar = function() {
            $rootScope.$broadcast('calendar:setdate', new Date());
        };

        this.getHeartTooltip = function() {
            return SeriesListState.state.isShowing ? $filter('translate')('TAB/library-hide/glyph') : $filter('translate')('TAB/library-show/glyph');
        };

        this.getTorrentClientTooltip = function() {
            var output = DuckieTorrent.getClient().getName();
            if (this.isTorrentClientConnecting()) return output + ': Connecting';
            return (this.isTorrentClientConnected()) ? output + ': Connected' : output + ': Offline';
        };

        this.go = function(state, noactive) {
            Array.prototype.map.call(document.querySelectorAll('#actionbar a'), function(el) {
                el.classList.remove('active');
            });
            var stateEl = document.querySelector('#actionbar_' + state);
            if (!noactive) {
                stateEl.classList.add('active');
            }
            stateEl.classList.add('fastspin');
            setTimeout(function() {
                $state.go(state).then(function() {
                    setTimeout(function() {
                        stateEl.classList.remove('fastspin');
                    }, 500);
                });

            });
        };

        this.getTorrentClientImage = function() {
            return '/img/torrentclients/' + DuckieTorrent.getClient().getName().split(' ')[0].toLowerCase() + '-small.png';
        };

        this.isTorrentClientConnected = function() {
            return DuckieTorrent.getClient().isConnected();
        };
        this.isTorrentClientConnecting = function() {
            return DuckieTorrent.getClient().isConnecting;
        };
    }
]);