DuckieTV.controller('localSeriesCtrl', ['$rootScope', 'FavoritesService', 'SeriesMetaTranslations',
  function($rootScope, FavoritesService, SeriesMetaTranslations) {
    var vm = this

    // Broadcast empty filter to reset the value in the SeriesList Ctrl
    $rootScope.$broadcast('serieslist:filter', '')
    $rootScope.$broadcast('serieslist:genreFilter', '')
    $rootScope.$broadcast('serieslist:statusFilter', '')

    vm.genreList = {}
    vm.statusList = {}
    vm.selectedGenres = []
    vm.selectedStatus = []
    vm.translateGenre = SeriesMetaTranslations.translateGenre
    vm.translateStatus = SeriesMetaTranslations.translateStatus

    // Populates what genres and status exist for our library and how many of each
    FavoritesService.favorites.map(function(serie) {
      if (serie.status !== '') {
        if (!(serie.status in vm.statusList)) {
          vm.statusList[serie.status] = 0
        }

        vm.statusList[serie.status]++
      }

      serie.genre.split('|').map(function(genre) {
        if (genre.length === 0) {
          return
        }

        if (!(genre in vm.genreList)) {
          vm.genreList[genre] = 0
        }

        vm.genreList[genre]++
      }, vm)
    }, vm)

    // Tells the filter control what to filter, updates 300ms after input
    vm.setFilter = function(val) {
      $rootScope.$broadcast('serieslist:filter', val)
      $rootScope.$applyAsync()
    }

    // Selects a genre
    vm.selectGenre = function(genre) {
      if (vm.selectedGenres.indexOf(genre) === -1) {
        vm.selectedGenres.push(genre)
      } else {
        vm.selectedGenres.splice(vm.selectedGenres.indexOf(genre), 1)
      }

      $rootScope.$broadcast('serieslist:genreFilter', vm.selectedGenres)
    }

    // Selects a status
    vm.selectStatus = function(status) {
      if (vm.selectedStatus.indexOf(status) === -1) {
        vm.selectedStatus.push(status)
      } else {
        vm.selectedStatus.splice(vm.selectedStatus.indexOf(status), 1)
      }

      $rootScope.$broadcast('serieslist:statusFilter', vm.selectedStatus)
    }

    // Returns if the genre is selected
    vm.getCheckedGenre = function(genre) {
      return vm.selectedGenres.indexOf(genre) > -1
    }

    // Returns if the status is selected
    vm.getCheckedStatus = function(status) {
      return vm.selectedStatus.indexOf(status) > -1
    }
  }
])
