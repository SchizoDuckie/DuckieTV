DuckieTV.controller('sidepanelTraktSerieCtrl', ['serie', 'SidePanelState', 'FavoritesManager', '$state', 'SeriesMetaTranslations',
  function(serie, SidePanelState, FavoritesManager, $state, SeriesMetaTranslations) {
    var vm = this

    vm.serie = serie
    vm.translateGenre = SeriesMetaTranslations.translateGenre
    vm.translateStatus = SeriesMetaTranslations.translateStatus
    vm.translateDayOfWeek = SeriesMetaTranslations.translateDayOfWeek

    // Takes a rating (8.12345) and converts it percentage presentation (81)
    vm.ratingPercentage = function(rating) {
      return Math.round(rating * 10)
    }

    // Closes the trakt-serie-details sidepanel
    vm.closeSidePanel = function() {
      SidePanelState.hide()
    }

    // Add to favorites, navigate to the show details
    vm.selectSerie = function() {
      return FavoritesManager.add(vm.serie).then(function() {
        $state.go('serie', {
          id: FavoritesManager.getById(vm.serie.tvdb_id).ID_Serie
        })
      })
    }
  }
])
