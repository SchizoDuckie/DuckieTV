/**
 * The <calendar-event> directive displays an episode on the calendar
 */
DuckieTV.directive('calendarEvent', ["SceneNameResolver", "AutoDownloadService", "SettingsService", "$location",
    function(SceneNameResolver, AutoDownloadService, SettingsService, $location) {
        return {
            restrict: 'E',
            scope: {
                serie: '=',
                episode: '=',
                count: '='
            },
            transclude: true,
            templateUrl: 'templates/event.html',
            controller: ["$scope", "$rootScope", "$location", function($scope, $rootScope, $location) {

                $scope.getSetting = SettingsService.get;
                $scope.hoverTimer = null;
                var cachedSearchString = false;

                /**
                 * Auto-switch background image to a relevant one for the calendar item when
                 * hovering over an item for 1.5s
                 * @return {[type]} [description]
                 */
                $scope.startHoverTimer = function() {
                    $scope.clearHoverTimer();
                    // Make sure serie has fanart defined
                    if ($scope.serie.fanart) {
                        var background = $scope.serie.fanart;
                        $scope.hoverTimer = setTimeout(function() {
                            $scope.$root.$broadcast('background:load', background);
                        }.bind(this), 1500);
                    }
                };

                $scope.clearHoverTimer = function() {
                    clearTimeout($scope.hoverTimer);
                };

                $scope.selectEpisode = function(serie, episode) {
                    $location.path('/serie/' + serie.TVDB_ID + '/season/' + episode.seasonnumber + '?episode=' + episode.TVDB_ID);
                };

                $scope.expand = function() {
                    $scope.$emit('expand:serie', $scope.episode.firstaired, $scope.serie.ID_Serie);
                };

            }]
        };
    }
]);