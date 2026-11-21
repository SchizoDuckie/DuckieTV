DuckieTV.controller('serieSettingsCtrl', ['$scope', '$filter', '$uibModalInstance', 'FavoritesService', 'SettingsService', 'FormlyLoader', 'data', 'TorrentSearchEngines', 'DuckieTorrent', 'SceneXemResolver', 'SceneNameResolver',
  function($scope, $filter, $modalInstance, FavoritesService, SettingsService, FormlyLoader, data, TorrentSearchEngines, DuckieTorrent, SceneXemResolver, SceneNameResolver) {
    // customDelay.max cannot exceed adPeriod (days converted to minutes).
    var adDelayMaxMinutes = parseInt(SettingsService.get('autodownload.period') * 24 * 60)

    /**
     * set up select list for search providers
     */
    $scope.searchProviders = [{'name': '', 'value': null}]
    Object.keys(TorrentSearchEngines.getSearchEngines()).map(function(searchProvider) {
      $scope.searchProviders.push({'name': searchProvider, 'value': searchProvider})
    })

    var serie = FavoritesService.getByTRAKT_ID(data.serie.TRAKT_ID)
    var preferenceFields = [
      'alias', 'autoDownload', 'ignoreHideSpecials', 'ignoreGlobalQuality',
      'ignoreGlobalIncludes', 'ignoreGlobalExcludes', 'customSearchString',
      'searchProvider', 'customSeeders', 'customIncludes', 'customExcludes',
      'customSearchSizeMin', 'customSearchSizeMax', 'customDelay', 'dlPath'
    ]
    $scope.defaultSearchName = SceneNameResolver.getSceneName(serie.TRAKT_ID, serie.name)
    $scope.searchAliases = SceneXemResolver.getXemAliasListForSerie(serie)
    var mappings = { options: { searchProviders: $scope.searchProviders } }

    /**
     * set up delay error message interpolation
     */
    mappings.data = {
      'delayErrorMessage': '"' + $filter('translate')('COMMON/autodownload-delay-range/alert', {addelaymax: adDelayMaxMinutes.minsToDhm()}) + '"'
    }

    /**
     * set up days, hours and minutes validation
     */
    mappings.validators = {
      'customDelayInput': {
        'expression': function(viewValue, modelValue, scope) {
          var value = modelValue || viewValue
          // if empty then exit
          if (value === null || undefined === value || value === '') {
            return true
          }
          // parse dhm
          var dhmPart = value.split(/[\s:]+/)
          var days = parseInt(dhmPart[0])
          var hours = parseInt(dhmPart[1])
          var minutes = parseInt(dhmPart[2])
          // test validity and set error state
          return (days >= 0 && days <= 21 && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && value.dhmToMins() <= adDelayMaxMinutes)
        }
      }
    }

    /**
     * set up form field contents
     */
    FormlyLoader.load('SerieSettings', mappings).then(function(form) {
      // Keep edits in the dialog until Save, including changes made by Formly.
      $scope.model = { name: serie.name }
      preferenceFields.forEach(function(key) { $scope.model[key] = serie[key] })
      $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials == 1
      $scope.model.autoDownload = $scope.model.autoDownload == 1
      $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality == 1
      $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes == 1
      $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes == 1

      // determine if client is local or remote (not fool proof, is there a better way?)
      var client = DuckieTorrent.getClient()
      var server = client && (client.getName() === 'uTorrent' ? 'http://localhost' : client.config.server)
      var isLocal = (server === 'http://127.0.0.1' || server === 'http://localhost')
      var isStandalone = SettingsService.isStandalone()
      var isDownloadPathSupported = client && client.isDownloadPathSupported()

      $scope.model.dlPathLocal = $scope.model.dlPath
      $scope.model.dlPathRemote = $scope.model.dlPath

      $scope.model.isDownloadPathSupportedLocal = (isDownloadPathSupported && isStandalone && isLocal)
      $scope.model.isDownloadPathSupportedRemote = (isDownloadPathSupported && ((!isStandalone) || (isStandalone && !isLocal)))

      // note: we are not using $scope.model.customDelay directly as input, to prevent downstream issues with dialogue save and cancel
      $scope.model.customDelayInput = ($scope.model.customDelay == null) ? null : $scope.model.customDelay.minsToDhm()
      $scope.fields = form
    })

    /**
     * save and persist model
     */
    $scope.save = function() {
      $scope.model.ignoreHideSpecials = $scope.model.ignoreHideSpecials ? 1 : 0
      $scope.model.autoDownload = $scope.model.autoDownload ? 1 : 0
      $scope.model.ignoreGlobalQuality = $scope.model.ignoreGlobalQuality ? 1 : 0
      $scope.model.ignoreGlobalIncludes = $scope.model.ignoreGlobalIncludes ? 1 : 0
      $scope.model.ignoreGlobalExcludes = $scope.model.ignoreGlobalExcludes ? 1 : 0
      // despite (because?) type=number, some invalid data trapped by formly returns undefined. so this ensures that we persist as null to stop downstream errors.
      $scope.model.customSeeders = (typeof $scope.model.customSeeders === 'undefined') ? null : $scope.model.customSeeders
      $scope.model.customSearchSizeMin = (typeof $scope.model.customSearchSizeMin === 'undefined') ? null : $scope.model.customSearchSizeMin
      $scope.model.customSearchSizeMax = (typeof $scope.model.customSearchSizeMax === 'undefined') ? null : $scope.model.customSearchSizeMax
      $scope.model.customDelay = (typeof $scope.model.customDelayInput === 'undefined' || $scope.model.customDelayInput === null || $scope.model.customDelayInput === '') ? null : $scope.model.customDelayInput.dhmToMins()
      if ($scope.model.isDownloadPathSupportedLocal) {
        // save model dlPath from content of model dlPathLocal
        $scope.model.dlPath = (typeof $scope.model.dlPathLocal === 'undefined' || $scope.model.dlPathLocal === '') ? null : $scope.model.dlPathLocal
      }
      if ($scope.model.isDownloadPathSupportedRemote) {
        // save model dlPath from content of model dlPathRemote
        $scope.model.dlPath = (typeof $scope.model.dlPathRemote === 'undefined' || $scope.model.dlPathRemote === '') ? null : $scope.model.dlPathRemote
      }

      $scope.model.alias = ($scope.model.alias || '').trim() || null
      preferenceFields.forEach(function(key) { serie[key] = $scope.model[key] })
      return serie.Persist().then(function() {
        $modalInstance.close()
        $scope.$destroy()
      })
    }

    /**
     * get out of dodge
     */
    $scope.cancel = function() {
      $modalInstance.close()
      $scope.$destroy()
    }
  }
])

DuckieTV.directive('downloadpath', [function () {
  return {
    scope: {
      downloadpath: '='
    },
    link: function (scope, element, attributes) {
      element.bind('change', function (changeEvent) {
        if (!changeEvent.target.files || !changeEvent.target.files.length) {
          return
        }
        scope.$apply(function () {
          scope.downloadpath = changeEvent.target.files[0].path
        })
      })
    }
  }
}])
