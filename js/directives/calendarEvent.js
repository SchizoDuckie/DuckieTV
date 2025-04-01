/**
 * The <calendar-event> directive displays an episode on the calendar
 */
DuckieTV.directive('calendarEvent', ['SettingsService',
  function(SettingsService) {
    return {
      restrict: 'E',
      scope: {
        serie: '=',
        episode: '=',
        count: '='
      },
      transclude: true,
      templateUrl: 'templates/event.html',
      controller: ['$scope', '$location', function($scope, $location) {
        $scope.getSetting = SettingsService.get
        $scope.hoverTimer = null

        // Auto-switch background image to a relevant one for the calendar item when hovering over an item for 1.5s
        $scope.startHoverTimer = function() {
          $scope.clearHoverTimer()
          // Make sure serie has fanart defined
          if ($scope.serie.fanart) {
            $scope.hoverTimer = setTimeout(function() {
              $scope.$root.$broadcast('background:load', $scope.serie)
            }, 1500)
          }
        }

        $scope.clearHoverTimer = function() {
          clearTimeout($scope.hoverTimer)
        }

        $scope.selectEpisode = function(serie, episode) {
          $location.path('/serie/' + serie.TRAKT_ID + '/season/' + episode.seasonnumber + '?episode=' + episode.TRAKT_ID)
        }

        $scope.expand = function() {
          $scope.$emit('expand:serie', $scope.episode.firstaired, $scope.serie.ID_Serie)
        }
      }]
    }
  }
])

DuckieTV.directive('eventName', [function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'templates/event/eventName.html'
  }
}])
