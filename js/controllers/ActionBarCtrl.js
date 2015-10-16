/**
 * Actionbar Controller
 */
DuckieTV.controller('ActionBarCtrl', ["$rootScope", "$state", "$filter", "SeriesListState", "SidePanelState", "DuckieTorrent",
    function($rootScope, $state, $filter, SeriesListState, SidePanelState, DuckieTorrent) {

        if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {
            var gui = require('nw.gui');
            // Reference to window
            var win = gui.Window.get();
            // listen for standalone menu go-to events
            win.on('standalone.calendar', function() {
                $state.go('calendar');
                SeriesListState.hide();
            });
            win.on('standalone.favorites', function() {
                SidePanelState.hide();
                SeriesListState.show();
                $state.go('favorites');
            });
            win.on('standalone.settings', function() {
                $state.go('settings');
            });
            win.on('standalone.about', function() {
                $state.go('about');
            });
        };

        // Resets calendar to current date
        this.resetCalendar = function() {
            $rootScope.$broadcast('calendar:setdate', new Date());
        };

        this.hidePanels = function() {
            SeriesListState.hide();
            SidePanelState.hide();
        };
        /**
         * SeriesList state needs to be managed manually because it is stickied and navigating away from
         * it doesn't actually close the state so reponing it doesn't refire it's resolves.
         */
        this.toggleSeriesList = function() {
            if (SeriesListState.state.isShowing) {
                $state.go('calendar');
                SeriesListState.hide();
            } else {
                SidePanelState.hide();
                SeriesListState.show();
                $state.go('favorites');
            }
        };

        // Used by Settings to button
        this.contractSidePanel = function() {
            SidePanelState.show();
            SidePanelState.contract();
        };

        this.getHeartTooltip = function() {
            var libraryHide = $filter('translate')('TAB/library-hide/glyph'),
                libraryShow = $filter('translate')('TAB/library-show/glyph');
            return SeriesListState.state.isShowing ? libraryHide : libraryShow;
        };

        this.getTorrentClientTooltip = function() {
            var output = DuckieTorrent.getClient().getName(),
                tcConnecting = ': ' + $filter('translate')('TAB/tc-connecting/glyph'),
                tcConnected = ': ' + $filter('translate')('TAB/tc-connected/glyph'),
                tcOffline = ': ' + $filter('translate')('TAB/tc-offline/glyph');
            if (this.isTorrentClientConnecting()) return output + tcConnecting;
            return (this.isTorrentClientConnected()) ? output + tcConnected : output + tcOffline;
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