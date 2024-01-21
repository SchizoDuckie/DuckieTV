DuckieTV.controller('traktTvTrendingCtrl', ['$scope', 'TraktTVTrending', 'FavoritesService', 'SeriesMetaTranslations',
  function($scope, TraktTVTrending, FavoritesService, SeriesMetaTranslations) {
    var vm = this

    vm.results = []
    vm.filtered = []
    vm.limit = 75
    vm.oldLimit = 75
    vm.activeCategory = false
    vm.activeStatus = false
    vm.translateCategory = SeriesMetaTranslations.translateGenre
    vm.translateStatus = SeriesMetaTranslations.translateStatus

    FavoritesService.waitForInitialization().then(function() {
      if (FavoritesService.favorites.length === 0) {
        vm.noFavs = true
      }
    })

    // enables excluding series already in favourites from trending results
    var alreadyAddedSerieFilter = function(serie) {
      return FavoritesService.favoriteIDs.indexOf(serie.trakt_id.toString()) === -1
    }

    vm.getCategories = function() {
      return TraktTVTrending.getCategories()
    }

    vm.getStatuses = function() {
      return TraktTVTrending.getStatuses()
    }

    vm.toggleCategory = function(category) {
      if (!category || vm.activeCategory === category) {
        vm.activeCategory = false
      } else {
        vm.activeCategory = category
      }

      filterResults()
    }

    vm.toggleStatus = function(status) {
      if (!status || vm.activeStatus === status) {
        vm.activeStatus = false
      } else {
        vm.activeStatus = status
      }

      filterResults()
    }

    async function filterResults() {
      var trending = await TraktTVTrending.getAll()
      var results = trending.filter(alreadyAddedSerieFilter)

      if (!vm.activeCategory && !vm.activeStatus) {
        vm.limit = vm.oldLimit
        vm.filtered = results
      }

      if (vm.activeCategory) {
        results = results.filter(function(el) {
          return el.genres.indexOf(vm.activeCategory) > -1
        })
      }

      if (vm.activeStatus) {
        results = results.filter(function(el) {
          return el.status === vm.activeStatus
        })
      }

      vm.filtered = results
      vm.limit = vm.filtered.length
      $scope.$applyAsync()
    }

    vm.getFilteredResults = function() {
      return vm.filtered
    }

    TraktTVTrending.getAll().then(function(results) {
      vm.filtered = results.filter(alreadyAddedSerieFilter)
    })
  }
])
