DuckieTV.controller('traktTvTrendingCtrl', ['TraktTVTrending', 'FavoritesService', 'SeriesMetaTranslations',
  function(TraktTVTrending, FavoritesService, SeriesMetaTranslations) {
    var vm = this

    vm.results = []
    vm.filtered = []
    vm.limit = 75
    vm.oldLimit = 75
    vm.activeCategory = false
    vm.translateCategory = SeriesMetaTranslations.translateGenre

    FavoritesService.waitForInitialization().then(function() {
      if (FavoritesService.favorites.length === 0) {
        vm.noFavs = true
      }
    })

    // enables excluding series already in favourites from trending results
    var alreadyAddedSerieFilter = function(serie) {
      return FavoritesService.favoriteIDs.indexOf(serie.tvdb_id.toString()) === -1
    }

    vm.getCategories = function() {
      return TraktTVTrending.getCategories()
    }

    vm.toggleCategory = function(category) {
      if (!category || vm.activeCategory === category) {
        vm.activeCategory = false
        vm.limit = vm.oldLimit

        TraktTVTrending.getAll().then(function(result) {
          vm.filtered = result.filter(alreadyAddedSerieFilter)
        })
      } else {
        vm.activeCategory = category
        vm.filtered = TraktTVTrending.getByCategory(category).filter(alreadyAddedSerieFilter)
        vm.limit = vm.filtered.length
      }
    }

    vm.getFilteredResults = function() {
      return vm.filtered
    }

    TraktTVTrending.getAll().then(function(results) {
      vm.filtered = results.filter(alreadyAddedSerieFilter)
    })
  }
])
