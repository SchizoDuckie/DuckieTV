DuckieTV.controller('SidepanelEpisodeCtrl', ['serie', 'episode', 'season', 'AutoDownloadService', 'SubtitleDialog', 'DuckieTorrent', 'dialogs', '$scope', '$injector', 'SettingsService', '$state',
  function(serie, episode, season, AutoDownloadService, SubtitleDialog, DuckieTorrent, dialogs, $scope, $injector, SettingsService, $state) {
    var vm = this
    vm.serie = serie
    vm.episode = episode
    vm.season = season

    /**
     * Closes the SidePanel
     */
    vm.closeSidePanel = function() {
      $injector.get('$state').go('calendar')
    }

    vm.markLeaked = function() {
      vm.episode.leaked = 1
      vm.episode.Persist()
    }

    var gotoFirstUnwatchedSeason = SettingsService.get('series.not-watched-eps-btn')
    vm.gotoEpisodes = function() {
      var getSeasonFunc = gotoFirstUnwatchedSeason ? serie.getNotWatchedSeason() : serie.getActiveSeason()

      getSeasonFunc.then(function(result) {
        $state.go('serie.season', {
          id: serie.ID_Serie,
          season_id: result.ID_Season
        })
      })
    }

    vm.autoDownload = function() {
      AutoDownloadService.autoDownload(vm.serie, vm.episode)
    }

    vm.torrentSettings = function() {
      var d = dialogs.create('templates/settings/serieSettings.html', 'serieSettingsCtrl', {
        serie: vm.serie
      }, {
        bindToController: true,
        size: 'xs'
      })

      d.result.then(function() {
        d = undefined
      }, function() {
        d = undefined
      })
    }

    vm.getSearchString = function(serie, episode) {
      if (!serie || !episode) return
      return serie.name + ' ' + episode.getFormattedEpisode()
    }

    vm.isTorrentClientConnected = function() {
      return DuckieTorrent.getClient().getRemote().isConnected()
    }

    vm.findSubtitle = function() {
      SubtitleDialog.searchEpisode(vm.serie, vm.episode)
    }

    /**
     * This watches for the torrent:select event that will be fired by the
     * TorrentSearchEngines when a user selects a magnet or .torrent link for an episode.
     */
    $scope.$on('torrent:select:' + vm.episode.TRAKT_ID, function(evt, magnet) {
      vm.episode.magnetHash = magnet
      vm.episode.downloaded = 0
      vm.episode.Persist()
    })
  }
])
