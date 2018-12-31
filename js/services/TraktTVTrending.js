DuckieTV.factory('TraktTVTrending', ['TraktTVv2', 'FavoritesService', '$q',
  function(TraktTVv2, FavoritesService, $q) {
    var vm = this
    vm.trending = []
    vm.categories = []
    vm.initializing = true

    /*
    * enables excluding series already in favourites from trending results
    */
    var alreadyAddedSerieFilter = function(serie) {
      return FavoritesService.favoriteIDs.indexOf(serie.tvdb_id.toString()) === -1
    }

    var service = {
      getAll: function() {
        if (vm.initializing) {
          return TraktTVv2.trending().then(function(series) {
            if (!series) {
              series = []
            }

            vm.trending = series
            var cats = {}

            series.filter(alreadyAddedSerieFilter).map(function(serie) {
              if (!serie.genres) return
              serie.genres.map(function(category) {
                cats[category] = true
              })
            })

            vm.categories = Object.keys(cats)
            return series
          })
        } else {
          return $q(function(resolve) {
            resolve(vm.trending)
          })
        }
      },

      getById: function(tvdb_id) {
        return vm.trending.filter(function(el) {
          return el.tvdb_id == tvdb_id
        })[0]
      },

      getByTraktId: function(trakt_id) {
        return vm.trending.filter(function(el) {
          return el.trakt_id == trakt_id
        })[0]
      },

      getCategories: function() {
        return vm.categories
      },

      getByCategory: function(category) {
        var filtered = vm.trending.filter(function(show) {
          if (!show.genres) return
          return show.genres.indexOf(category) > -1
        })
        return filtered
      }
    }

    service.getAll().then(function() {
      vm.initializing = false
    })

    return service
  }
])
