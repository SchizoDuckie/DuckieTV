DuckieTV.controller('sidepanelTraktSerieCtrl', ['$filter', '$locale', 'serie', 'SidePanelState', 'FavoritesManager', '$state',
  function($filter, $locale, serie, SidePanelState, FavoritesManager, $state) {
    var vm = this
    vm.serie = serie

    /**
     * Takes a rating (8.12345) and converts it percentage presentation (81)
     */
    vm.ratingPercentage = function(rating) {
      return Math.round(rating * 10)
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
     * Closes the trakt-serie-details sidepanel
     */
    vm.closeSidePanel = function() {
      SidePanelState.hide()
    }

    /**
     * Add to favorites, navigate to the show details
     */
    vm.selectSerie = function() {
      return FavoritesManager.add(vm.serie).then(function() {
        $state.go('serie', {
          id: FavoritesManager.getById(self.serie.tvdb_id).ID_Serie
        })
      })
    }
  }
])
