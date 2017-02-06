DuckieTV.directive('actionBar', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/actionBar.html',
        controllerAs: 'actionbar',
        controller: ["$rootScope", "$state", "$filter", "SeriesListState", "SidePanelState", "DuckieTorrent",
            function($rootScope, $state, $filter, SeriesListState, SidePanelState, DuckieTorrent) {
                if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {
                    // listen for standalone menu go-to events
                    $rootScope.$on('standalone.calendar', function() {
                        $state.go('calendar');
                        SeriesListState.hide();
                    });
                    $rootScope.$on('standalone.favorites', function() {
                        SidePanelState.hide();
                        SeriesListState.show();
                        $state.go('favorites');
                    });
                    $rootScope.$on('standalone.adlstatus', function() {
                        $state.go('autodlstatus');
                    });
                    $rootScope.$on('standalone.settings', function() {
                        $state.go('settings');
                    });
                    $rootScope.$on('standalone.about', function() {
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
                this.libraryHide = function() {
                    return $filter('translate')('TAB/library-hide/glyph');
                };
                this.libraryShow = function() {
                    return $filter('translate')('TAB/library-show/glyph');
                };
                this.tcConnecting = function() {
                    return ': ' + $filter('translate')('COMMON/tc-connecting/lbl');
                };
                this.tcConnected = function() {
                    return ': ' + $filter('translate')('COMMON/tc-connected/lbl');
                };
                this.tcOffline = function() {
                    return ': ' + $filter('translate')('COMMON/tc-offline/lbl');
                };

                this.getHeartTooltip = function() {
                    return SeriesListState.state.isShowing ? this.libraryHide() : this.libraryShow();
                };

                this.getTorrentClientTooltip = function() {
                    var output = DuckieTorrent.getClient().getName();
                    if (this.isTorrentClientConnecting()) return output + this.tcConnecting();
                    return (this.isTorrentClientConnected()) ? output + this.tcConnected() : output + this.tcOffline();
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
