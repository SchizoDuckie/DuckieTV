/**
 * Controller for all seasons view
 */
DuckieTV.controller('SidepanelSeasonsCtrl', ['$rootScope', '$filter', 'seasons', 'SidePanelState', 'SettingsService',
  function($rootScope, $filter, seasons, SidePanelState, SettingsService) {
    var vm = this
    vm.seasons = seasons
    vm.markAllWatchedAlert = false
    vm.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing')

    // Closes the SidePanel expansion
    vm.closeSidePanelExpansion = function() {
      SidePanelState.contract()
    }

    vm.markAllWatched = function() {
      vm.seasons.map(function(season) {
        season.markSeasonAsWatched(vm.watchedDownloadedPaired, $rootScope).then(function() {
          $rootScope.$broadcast('serie:recount:watched', season.ID_Serie)
          vm.markAllWatchedAlert = false // reset alert flag
        })
      })
    }

    vm.markAllWatchedCancel = function() {
      vm.markAllWatchedAlert = false // reset alert flag
    }

    vm.markAllWatchedQuery = function() {
      vm.markAllWatchedAlert = true // set alert flag
    }

    vm.getPosterLabel = function(seasonNumber) {
      return seasonNumber === 0 ? $filter('translate')('COMMON/specials/lbl') : $filter('translate')('COMMON/season/lbl') + ' ' + seasonNumber
    }
  }
])
