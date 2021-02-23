DuckieTV.controller('SidepanelSerieCtrl', ['$rootScope', '$filter', '$state', '$injector', 'dialogs', 'FavoritesService', 'serie', 'SidePanelState', 'SettingsService', 'FavoritesManager', 'SeriesMetaTranslations',
  function($rootScope, $filter, $state, $injector, dialogs, FavoritesService, serie, SidePanelState, SettingsService, FavoritesManager, SeriesMetaTranslations) {
    var vm = this
    vm.serie = serie
    vm.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing')
    vm.isRefreshing = false
    vm.markAllWatchedAlert = false
    vm.translateGenre = SeriesMetaTranslations.translateGenre
    vm.translateStatus = SeriesMetaTranslations.translateStatus
    vm.translateDayOfWeek = SeriesMetaTranslations.translateDayOfWeek

    // Closes the SidePanel expansion
    vm.closeSidePanel = function() {
      SidePanelState.hide()
    }

    // Closes the SidePanel expansion
    vm.closeSidePanelExpansion = function() {
      $injector.get('SidePanelState').contract()
      $state.go('serie')
    }

    vm.refresh = function(serie) {
      vm.isRefreshing = true
      console.log('[SerieRefresh] [TRAKT_ID=' + serie.TRAKT_ID + ']', 'updating', serie.name)
      return FavoritesManager.refresh(serie.TRAKT_ID).then(function() {
        vm.isRefreshing = false
        $rootScope.$applyAsync()
      })
    }

    var timePlurals = $filter('translate')('TIMEPLURALS').split('|') // " day, | days, | hour and | hours and | minute | minutes "
    vm.totalRunTime = null
    vm.totalRunLbl = null
    CRUD.executeQuery('select count(ID_Episode) as amount from Episodes where seasonnumber > 0 AND firstaired > 0 AND firstaired < ? AND ID_Serie = ? group by episodes.ID_Serie', [new Date().getTime(), vm.serie.ID_Serie]).then(function(result) {
      if (result.rows.length > 0) {
        vm.totalRunTime = result.rows[0].amount * vm.serie.runtime
        var totalRunDays = Math.floor(vm.totalRunTime / 60 / 24)
        var totalRunHours = Math.floor((vm.totalRunTime % (60 * 24)) / 60)
        var totalRunMinutes = vm.totalRunTime % 60
        var dayLbl = (totalRunDays === 1) ? timePlurals[0] : timePlurals[1]
        var hourLbl = (totalRunHours === 1) ? timePlurals[2] : timePlurals[3]
        var minuteLbl = (totalRunMinutes === 1) ? timePlurals[4] : timePlurals[5]
        vm.totalRunLbl = ((totalRunDays > 0) ? (totalRunDays.toString() + dayLbl) : '') + totalRunHours.toString() + hourLbl + totalRunMinutes.toString() + minuteLbl
      } else {
        vm.totalRunTime = 1
        vm.totalRunLbl = '0' + timePlurals[1] + '0' + timePlurals[3] + '0' + timePlurals[5]
      }
      return true
    }).then(function() {
      CRUD.executeQuery('select count(ID_Episode) as amount from Episodes where seasonnumber > 0 AND firstaired > 0 AND firstaired < ? AND ID_Serie = ? AND watched = 1 group by episodes.ID_Serie', [new Date().getTime(), vm.serie.ID_Serie]).then(function(result) {
        if (result.rows.length > 0) {
          vm.totalWatchedTime = result.rows[0].amount * vm.serie.runtime
          var totalRunDays = Math.floor(vm.totalWatchedTime / 60 / 24)
          var totalRunHours = Math.floor((vm.totalWatchedTime % (60 * 24)) / 60)
          var totalRunMinutes = vm.totalWatchedTime % 60
          var dayLbl = (totalRunDays === 1) ? timePlurals[0] : timePlurals[1]
          var hourLbl = (totalRunHours === 1) ? timePlurals[2] : timePlurals[3]
          var minuteLbl = (totalRunMinutes === 1) ? timePlurals[4] : timePlurals[5]
          vm.totalWatchedLbl = ((totalRunDays > 0) ? totalRunDays.toString() + dayLbl : '') + ((totalRunHours > 0) ? totalRunHours.toString() + hourLbl : '') + totalRunMinutes.toString() + minuteLbl
          vm.totalWatchedPercent = $filter('number')(vm.totalWatchedTime / vm.totalRunTime * 100, 2)
        } else {
          vm.totalWatchedTime = 1
          vm.totalWatchedLbl = '0' + timePlurals[1] + '0' + timePlurals[3] + '0' + timePlurals[5]
          vm.totalWatchedPercent = 0
        }
        $rootScope.$applyAsync()
      })
    })

    vm.nextEpisode = null
    vm.prevEpisode = null

    serie.getLastEpisode().then(function(result) {
      vm.prevEpisode = result
      $rootScope.$applyAsync()
    })

    serie.getNextEpisode().then(function(result) {
      vm.nextEpisode = result
      $rootScope.$applyAsync()
    })

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

    vm.markAllWatched = function(serie) {
      serie.markSerieAsWatched(vm.watchedDownloadedPaired, $rootScope).then(function() {
        $rootScope.$broadcast('serie:recount:watched', serie.ID_Serie)
        vm.markAllWatchedAlert = false // reset alert flag
      })
    }

    vm.markAllWatchedCancel = function() {
      vm.markAllWatchedAlert = false // reset alert flag
    }

    vm.markAllWatchedQuery = function() {
      vm.markAllWatchedAlert = true // set alert flag
    }

    vm.torrentSettings = function() {
      var d = dialogs.create('templates/settings/serieSettings.html', 'serieSettingsCtrl', {
        serie: vm.serie
      }, {
        bindToController: true,
        size: 'xs'
      })

      d.result.then(function() {
        // console.debug('Success');
        d = undefined
      }, function() {
        // console.debug('Cancelled');
        d = undefined
      })
    }

    vm.removeFromFavorites = function() {
      FavoritesManager.remove(vm.serie).then(function() {
        SidePanelState.hide()
      })
    }

    /**
     * Returns true as long as the add a show to favorites promise is running.
     */
    vm.isAdding = function(trakt_id) {
      return FavoritesService.isAdding(trakt_id)
    }

    vm.dataToClipboard = function(data) {
      var clip = nw.Clipboard.get()
      clip.set(data.replace(/\|/g, '\r\n'), 'text')
    }
  }
])
