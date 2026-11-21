/**
 * The <calendar-event> directive displays an episode on the calendar
 */
DuckieTV.directive('calendarEvent', ['SettingsService', 'AutoDownloadService', '$translate',
  function(SettingsService, AutoDownloadService, $translate) {
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

        $scope.episodeMenu = function(serie, episode, count) {
          if (count > 2 || !SettingsService.get('torrenting.enabled') || !serie?.TVDB_ID ||
              !(episode.hasAired() || episode.isLeaked())) return []

          return [[$translate.instant('COMMON/auto-download/lbl'), function() {
            return AutoDownloadService.autoDownload(serie, episode, true)
          }]]
        }

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
        $scope.$on('$destroy', $scope.clearHoverTimer)

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
