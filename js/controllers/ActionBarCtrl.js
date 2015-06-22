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
            var libraryHide = $filter('translate')('TAB/library-hide/glyph');
            var libraryShow = $filter('translate')('TAB/library-show/glyph');
            return SeriesListState.state.isShowing ? libraryHide : libraryShow;
        };

        this.getTorrentClientTooltip = function() {
            var output = DuckieTorrent.getClient().getName();
            var tcConnecting = ': ' + $filter('translate')('TAB/tc-connecting/glyph');
            var tcConnected = ': ' + $filter('translate')('TAB/tc-connected/glyph');
            var tcOffline = ': ' + $filter('translate')('TAB/tc-offline/glyph');
            if (this.isTorrentClientConnecting()) return output + tcConnecting;
            return (this.isTorrentClientConnected()) ? output + tcConnected : output + tcOffline;
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

        this.getTorrentClientClass = function() {
            return DuckieTorrent.getClient().getName().split(' ')[0].toLowerCase();
        };

        this.isTorrentClientConnected = function() {
            return DuckieTorrent.getClient().isConnected();
        };
        this.isTorrentClientConnecting = function() {
            return DuckieTorrent.getClient().isConnecting;
        };
    }
]);