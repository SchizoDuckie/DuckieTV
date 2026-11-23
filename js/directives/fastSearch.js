DuckieTV.directive('fastSearch', ['$window', 'dialogs',
  function($window, dialogs) {
    var self = this

    this.fsquery = ''
    this.isNotKK = true // flag used to prevent kk sequence from triggering fast-search
    this.fsKKi = 0 // index used in preventing kk sequence from triggering fast-search

    var isShowing = false

    // The modal input may not exist yet. Keep the typed query until it mounts,
    // and stop polling if the modal closes before it does.
    var focusInput = function() {
      if (!isShowing) return
      var i = document.querySelector('.fastsearch input')
      if (i) {
        i.focus()
        if (i.value !== self.fsquery) {
          i.value = self.fsquery
          i.dispatchEvent(new Event('input', { bubbles: true }))
        }
      } else {
        setTimeout(focusInput, 50)
      }
    }

    this.createDialog = function() {
      isShowing = true
      var d = dialogs.create('templates/dialogs/fastSearch.html', 'fastSearchCtrl', {
        key: self.fsquery
      }, {
        size: 'xs'
      })

      setTimeout(focusInput, 50)

      function resetSearch() {
        isShowing = false
        self.fsquery = ''
      }
      d.result.then(resetSearch, resetSearch)
    }

    return {
      restrict: 'E',
      link: function() {
        $window.addEventListener('keydown', function(e) {
          // parse key codes, trap kk sequence
          var kk = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]
          if (e.keyCode === kk[self.fsKKi++]) {
            // possible kk sequence in progress
            if (self.fsKKi > 7) {
              // anticipating final kk sequence
              self.isNotKK = false
            }
          } else {
            // not kk sequence
            self.fsKKi = 0
            self.isNotKK = true
          }
        })
        $window.addEventListener('keypress', function(e) {
          // parse char codes for fs query
          if (!isShowing && e.target.tagName.toLowerCase() == 'input') {
            // keypress came from a non-fastSearch input element
            e.stopPropagation()
          } else if (self.isNotKK) {
            // keypress did not come from an input element
            self.fsquery += String.fromCharCode(e.charCode)
            if (!isShowing && e.target.tagName.toLowerCase() != 'input') {
              self.createDialog()
            }
          }
        })
      }
    }
  }
])

  .controller('fastSearchCtrl', ['$scope', '$uibModalInstance', 'data', 'FavoritesService', 'FavoritesManager', 'TraktTVv2', 'SidePanelState', 'TorrentSearchEngines', 'SettingsService', 'TorrentDownloadActions', 'AutoDownloadService',
    function($scope, $modalInstance, data, FavoritesService, FavoritesManager, TraktTVv2, SidePanelState, TorrentSearchEngines, SettingsService, TorrentDownloadActions, AutoDownloadService) {
      $scope.searchprovider = SettingsService.get('torrenting.searchprovider')
      $scope.hasFocus = true
      $scope.model = {
        fsquery: data.key
      }

      $scope.fields = [{
        key: 'fsquery',
        type: 'input',
        modelOptions: {
          'debounce': {
            'default': 500,
            'blur': 0
          },
          updateOn: 'default blur'
        },
        templateOptions: {
          label: '',
          placeholder: '',
          type: 'text',
          onChange: function(e) {
            $scope.search(e)
          }
        },
        'expressionProperties': {
          'templateOptions.label': '"FASTSEARCHjs/search-anything/lbl"|translate',
          'templateOptions.placeholder': '"FASTSEARCHjs/placeholder"|translate'
        }
      }]

      $scope.autoDownload = function(episode) {
        return AutoDownloadService.autoDownload($scope.getSerie(episode), episode, true)
      }

      $scope.getSerie = function(episode) {
        return FavoritesService.getByID_Serie(episode.ID_Serie)
      }

      /**
       * Start independent local, Trakt, episode, and torrent searches for a query.
       * Replacing the results object invalidates older asynchronous responses and
       * their loading indicators. Clearing the query invalidates them as well.
       */
      $scope.search = function(value) {
        var query = (value || '').trim()
        var results = { series: [], traktSeries: [], episodes: [], torrents: [] }
        $scope.searchResults = results
        $scope.traktSeriesLoading = !!query
        $scope.episodesLoading = !!query
        $scope.torrentsLoading = !!query && SettingsService.get('torrenting.enabled')
        if (!query) return

        var words = query.toLowerCase().split(/\s+/)
        function matches(title) {
          var name = title.toLowerCase()
          return words.every(function(word) { return name.includes(word) })
        }

        // Each search owns its results. A slower previous search must not replace this one.
        async function load(section, fetchResults) {
          try {
            results[section] = await fetchResults()
          } catch (error) {
            if ($scope.searchResults === results) console.warn('Fast Search failed for ' + section, error)
          } finally {
            if ($scope.searchResults === results) {
              $scope[section + 'Loading'] = false
              $scope.$applyAsync()
            }
          }
        }

        results.series = FavoritesService.favorites.filter(function(serie) { return matches(serie.name) })
        load('episodes', function() {
          // Treat SQL LIKE wildcards and the escape character as literal input.
          var pattern = '%' + query.replace(/[!%_]/g, '!$&') + '%'
          return CRUD.Find('Episode', [["Episodes.episodename LIKE ? ESCAPE '!'", pattern]], { limit: 9 })
        })
        load('traktSeries', async function() {
          var shows = await TraktTVv2.search(query)
          return shows.filter(function(show) { return matches(show.name) })
        })
        if ($scope.torrentsLoading) {
          load('torrents', async function() {
            var releases = await TorrentSearchEngines.getSearchEngine($scope.searchprovider).search(query)
            return releases.filter(function(release) { return matches(release.releasename) })
          })
        }
      }

      $scope.close = function() {
        $modalInstance.close('Closed')
      }

      // FavoritesManager owns the add state. Refresh results after a successful add.
      $scope.addTraktSerie = function(serie) {
        return FavoritesManager.add(serie).then(function(added) {
          SidePanelState.hide()
          if (added) $scope.search($scope.model.fsquery)
          return added
        })
      }

      /**
         * Verify with the favoritesservice if a specific trakt_id is registered.
         * Used to show checkmarks in the add modes for series that you already have.
         */
      $scope.isAdded = function(trakt_id) {
        return FavoritesService.isAdded(trakt_id)
      }

      /**
         * Returns true as long as the add a show to favorites promise is running.
         */
      $scope.isAdding = function(trakt_id) {
        return FavoritesService.isAdding(trakt_id)
      }

      /** Returns true when adding the show failed. */
      $scope.isError = function(trakt_id) {
        return FavoritesService.isError(trakt_id)
      }

      $scope.select = function(result) {
        return TorrentDownloadActions.start(result, $scope.searchprovider, $scope.model.fsquery).then(function(url) {
          if (url) $modalInstance.close(url)
        })
      }

      $scope.submitMagnetLink = function(result) {
        return TorrentDownloadActions.open(result, $scope.searchprovider, 'magnet')
      }

      $scope.search(data.key)
    }
  ])
