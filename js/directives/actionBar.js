DuckieTV.directive('actionBar', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/actionBar.html',
        controllerAs: 'actionbar',
        controller: ["$rootScope", "$state", "$filter", "SeriesListState", "SidePanelState", "DuckieTorrent",
            function($rootScope, $state, $filter, SeriesListState, SidePanelState, DuckieTorrent) {
                if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {
                    var win = require('nw.gui').Window.get();
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
                    win.on('standalone.adlstatus', function() {
                        $state.go('autodlstatus');
                    });
                    win.on('standalone.settings', function() {
                        $state.go('settings');
                    });
                    win.on('standalone.about', function() {
                        $state.go('about');
                    });
                }

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

                // Tooltips
                var libraryHide = $filter('translate')('TAB/library-hide/glyph'),
                    libraryShow = $filter('translate')('TAB/library-show/glyph'),
                    tcConnecting = ': ' + $filter('translate')('COMMON/tc-connecting/lbl'),
                    tcConnected = ': ' + $filter('translate')('COMMON/tc-connected/lbl'),
                    tcOffline = ': ' + $filter('translate')('COMMON/tc-offline/lbl');

                this.getHeartTooltip = function() {
                    return SeriesListState.state.isShowing ? libraryHide : libraryShow;
                };

                this.getTorrentClientTooltip = function() {
                    var output = DuckieTorrent.getClient().getName();
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
        ]
    };
})
