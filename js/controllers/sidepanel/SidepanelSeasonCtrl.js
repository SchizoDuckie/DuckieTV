/**
 * Controller for individual season view (episodes view)
 */
DuckieTV.controller('SidepanelSeasonCtrl', ['$rootScope', '$scope', '$state', '$filter', '$injector', 'seasons', 'season', 'episodes', 'SceneNameResolver', 'AutoDownloadService', 'SettingsService',
  function($rootScope, $scope, $state, $filter, $injector, seasons, season, episodes, SceneNameResolver, AutoDownloadService, SettingsService) {
    var vm = this
    vm.season = season
    vm.seasons = seasons
    vm.episodes = episodes
    vm.seasonIndex = null
    vm.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing')

    /**
     * Closes the SidePanel expansion
     */
    vm.closeSidePanelExpansion = function() {
      $injector.get('SidePanelState').contract()
      $state.go('serie')
    }

    // Find the current Season Index relative to all Seasons
    for (var i = 0; i < vm.seasons.length; i++) {
      if (vm.seasons[i].ID_Season == vm.season.ID_Season) {
        vm.seasonIndex = i
      }
    }

    vm.gotoPreviousSeason = function() {
      // If we're on the last season or specials
      if (vm.seasonIndex === vm.seasons.length - 1) {
        return
      } else {
        $state.go('serie.season', {
          'season_id': seasons[vm.seasonIndex + 1].ID_Season
        })
      }
    }

    vm.gotoFirstSeason = function() {
      $state.go('serie.season', {
        'season_id': seasons[vm.seasons.length - 1].ID_Season
      })
    }

    vm.gotoNextSeason = function() {
      // Seasons are sorted by latest to oldest therefore 0 should always the be latest.
      if (vm.seasonIndex === 0) {
        return
      } else {
        $state.go('serie.season', {
          'season_id': seasons[vm.seasonIndex - 1].ID_Season
        })
      }
    }

    vm.gotoLastSeason = function() {
      $state.go('serie.season', {
        'season_id': seasons[0].ID_Season
      })
    }

    vm.episodes.map(function(episode) {
      /**
       * This watches for the torrent:select event that will be fired by the
       * TorrentSearchEngines when a user selects a magnet or .torrent link for an episode.
       */
      $scope.$on('torrent:select:' + episode.TVDB_ID, function(evt, magnet) {
        episode.magnetHash = magnet
        episode.downloaded = 0
        episode.Persist()
      })
    })

    // Return 'Specials' header if current season is Specials.
    vm.getPageHeader = function(season) {
      if (!season) return ''
      return season.seasonnumber === 0 ? $filter('translate')('COMMON/specials/lbl') : $filter('translate')('COMMON/season/lbl') + ' ' + season.seasonnumber
    }

    vm.getSortEpisodeNumber = function(episode) {
      var sn = episode.seasonnumber.toString()
      var en = episode.episodenumber.toString()

      var out = ['S', sn.length === 1 ? '0' + sn : sn, 'E', en.length === 1 ? '00' + en : en.length === 2 ? '0' + en : en].join('')
      return out
    }

    vm.autoDownload = function(serie, episode) {
      if (!episode.isDownloaded() && episode.hasAired()) {
        AutoDownloadService.autoDownload(serie, episode)
      }
    }

    vm.autoDownloadAll = function() {
      var clickList = Array.from(document.querySelectorAll('.rightpanel .auto-download-episode'))
      clickList.reverse().map(function(el, idx) {
        setTimeout(function() {
          el.click()
        }, (idx + 1) * 100) // a setTimeout with 0ms (first element index of 0 times 100) seems to result in the first click to not fire,so we bump idx up by 1
      })
    }

    vm.markAllWatched = function() {
      vm.season.markSeasonAsWatched(vm.watchedDownloadedPaired, $rootScope).then(function() {
        $rootScope.$broadcast('serie:recount:watched', season.ID_Serie)
      })
    }

    vm.markAllDownloaded = function(episodes) {
      episodes.map(function(episode) {
        if ((episode.hasAired()) && (!episode.isDownloaded())) {
          episode.markDownloaded($rootScope)
        }
      })
    }

    vm.getSearchString = function(serie, episode) {
      if (!serie || !episode) return
      return serie.name + ' ' + episode.getFormattedEpisode()
    }

    vm.getSeasonSearchString = function(serie, season) {
      if (!serie || !season) return
      return SceneNameResolver.getSceneName(serie.TVDB_ID, serie.name) + ' season ' + season.seasonnumber
    }

    vm.getEpisodeNumber = function(episode) {
      var sn = episode.seasonnumber.toString()

      var en = episode.episodenumber.toString()

      var out = ['s', sn.length == 1 ? '0' + sn : sn, 'e', en.length == 1 ? '0' + en : en].join('')
      return out
    }

    // Ratings graph
    vm.points = []
    var data = $filter('orderBy')(vm.episodes, vm.getEpisodeNumber, false) // sort episodes by episode number
    data.map(function(episode) {
      vm.points.push({
        y: episode.rating,
        label: vm.getEpisodeNumber(episode) + ' : ' + episode.rating + '% (' + episode.ratingcount + ' ' + $filter('translate')('COMMON/votes/lbl') + ')',
        season: parseInt(episode.seasonnumber, 10)
      })
    })
  }
])
