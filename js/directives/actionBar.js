DuckieTV.directive('actionBar', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/actionBar.html',
        controllerAs: 'actionbar',
        controller: ["$rootScope", "$state", "$filter", "SeriesListState", "SeriesAddingState", "SidePanelState", "DuckieTorrent", "SettingsService",
            function($rootScope, $state, $filter, SeriesListState, SeriesAddingState, SidePanelState, DuckieTorrent, SettingsService) {
                if (SettingsService.isStandalone()) {
                    // listen for standalone menu go-to events
                    $rootScope.$on('standalone.calendar', function() {
                        $state.go('calendar');
                    });
                    $rootScope.$on('standalone.favorites', function() {
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


                /**
                 * SeriesList state needs to be managed manually because it is stickied and navigating away from
                 * it doesn't actually close the state so reponing it doesn't refire it's resolves.
                 */
                this.toggleSeriesList = function() {
                    if (!$state.is('favorites')) {
                        $state.go('favorites', {
                            refresh: new Date().getTime()
                        });
                        SeriesListState.show();
                        SeriesAddingState.hide();
                    } else {
                        $state.go('calendar');
                    }
                    $rootScope.$applyAsync();
                };

                /**
                 * SeriesList state needs to be managed manually because it is stickied and navigating away from
                 * it doesn't actually close the state so reponing it doesn't refire it's resolves.
                 */
                this.toggleAddingList = function() {
                    if (!$state.is('add_favorites')) {
                        $state.go('add_favorites', {
                            refresh: new Date().getTime()
                        });
                        SeriesListState.hide();
                        SeriesAddingState.show();
                    } else {
                        $state.go('calendar');
                    }
                    $rootScope.$applyAsync();
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