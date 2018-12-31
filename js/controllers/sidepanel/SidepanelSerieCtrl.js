DuckieTV.controller('SidepanelSerieCtrl', ['$rootScope', '$filter', '$locale', '$state', '$injector', 'dialogs', 'FavoritesService', 'latestSeason', 'notWatchedSeason', 'serie', 'SidePanelState', 'SettingsService', 'FavoritesManager',
  function($rootScope, $filter, $locale, $state, $injector, dialogs, FavoritesService, latestSeason, notWatchedSeason, serie, SidePanelState, SettingsService, FavoritesManager) {
    var vm = this
    vm.serie = serie
    vm.latestSeason = latestSeason
    vm.notWatchedSeason = notWatchedSeason
    vm.notWatchedEpsBtn = SettingsService.get('series.not-watched-eps-btn')
    vm.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing')
    vm.isRefreshing = false
    vm.markAllWatchedAlert = false

    /**
     * Closes the SidePanel expansion
     */
    vm.closeSidePanel = function() {
      SidePanelState.hide()
    }

    /**
     * Closes the SidePanel expansion
     */
    vm.closeSidePanelExpansion = function() {
      $injector.get('SidePanelState').contract()
      $state.go('serie')
    }

    vm.refresh = function(serie) {
      vm.isRefreshing = true
      return FavoritesManager.refresh(serie.TVDB_ID).then(function() {
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

    var genreList = 'action|adventure|animation|anime|biography|children|comedy|crime|disaster|documentary|drama|eastern|family|fan-film|fantasy|film-noir|food|game-show|history|holiday|home-and-garden|horror|indie|mini-series|music|musical|mystery|news|none|reality|road|romance|science-fiction|short|soap|special-interest|sports|sporting-event|superhero|suspense|talk-show|thriller|travel|tv-movie|war|western'.split('|')
    // used by vm.translateGenre()

    var translatedGenreList = $filter('translate')('GENRELIST').split('|')

    var translatedStatusList = $filter('translate')('STATUSLIST').split('|')

    var statusList = 'canceled|ended|in production|returning series|planned'.split('|')
    // used by vm.translateStatus()

    var daysOfWeekList = 'Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday'.split('|') // used by vm.translateDayOfWeek()

    /**
     * Takes the English Genre (as fetched from TraktTV) and returns a translation
     */
    vm.translateGenre = function(genre) {
      var idx = genreList.indexOf(genre)
      return (idx != -1) ? translatedGenreList[idx] : genre
    }

    /**
     * Takes the English day of the week (as fetched from TraktTV) and returns a translation
     */
    vm.translateDayOfWeek = function(dayofweek) {
      return $locale.DATETIME_FORMATS.DAY[daysOfWeekList.indexOf(dayofweek)]
    }

    /**
     * Takes the English status (as fetched from TraktTV) and returns a translation
     */
    vm.translateStatus = function(status) {
      var idx = statusList.indexOf(status)
      return (idx != -1) ? translatedStatusList[idx] : status
    }

    /**
     * Returns true as long as the add a show to favorites promise is running.
     */
    vm.isAdding = function(tvdb_id) {
      return FavoritesService.isAdding(tvdb_id)
    }

    vm.dataToClipboard = function(data) {
      var clip = nw.Clipboard.get()
      clip.set(data.replace(/\|/g, '\r\n'), 'text')
    }
  }
])
