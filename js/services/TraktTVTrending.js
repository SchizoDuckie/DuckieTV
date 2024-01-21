DuckieTV.factory('TraktTVTrending', ['TraktTVv2', 'FavoritesService', '$q',
  function(TraktTVv2, FavoritesService, $q) {
    var vm = this
    vm.trending = []
    vm.categories = []
    vm.statuses = []
    vm.initializing = true

    /*
    * enables excluding series already in favourites from trending results
    */
    var alreadyAddedSerieFilter = function(serie) {
      return FavoritesService.favoriteIDs.indexOf(serie.trakt_id.toString()) === -1
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
            var statuses = []

            series.filter(alreadyAddedSerieFilter).map(function(serie) {
              if (!serie.genres) return
              serie.genres.map(function(category) {
                cats[category] = true
              })

              if (serie.status && !statuses.includes(serie.status)) {
                statuses.push(serie.status)
              }
            })

            vm.categories = Object.keys(cats)
            vm.statuses = statuses

            return series
          })
        } else {
          return $q(function(resolve) {
            resolve(vm.trending)
          })
        }
      },

      getByTraktId: function(trakt_id) {
        return vm.trending.filter(function(el) {
          return el.trakt_id == trakt_id
        })[0]
      },

      getCategories: function() {
        return vm.categories
      },

      getStatuses: function() {
        return vm.statuses
      },

      getByCategory: function(category) {
        return vm.trending.filter(function(show) {
          if (!show.genres) return
          return show.genres.indexOf(category) > -1
        })
      },

      getByStatus: function(status) {
        return vm.trending.filter(function(show) {
          return show.status === status
        })
      }
    }

    service.getAll().then(function() {
      vm.initializing = false
    })

    return service
  }
])
