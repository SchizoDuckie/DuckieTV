DuckieTV.controller('jackettSearchEngineCtrl', ['$http', 'TorrentSearchEngines', 'dialogs',
  function($http, TorrentSearchEngines, dialogs) {
    var vm = this

    // load the default engines
    vm.nativeEngines = TorrentSearchEngines.getNativeEngines()

    // load the jackett engines
    vm.jackettEngines = TorrentSearchEngines.getJackettEngines()

    // delete a jackett SE
    vm.remove = function(engine) {
      TorrentSearchEngines.removeJackettEngine(engine)
      vm.jackettEngines = TorrentSearchEngines.getJackettEngines()
    }

    // is the test button available?
    vm.isTestDisabled = function(engine) {
      return engine.config.useTorznab
    }

    // test jackett SE (using jackett admin test api)
    vm.test = function(engine) {
      vm.jackettEngines[engine.config.name].testing = true
      $http.post(engine.config.test, {'indexer': engine.config.tracker}, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'cache': false
        }
      }).then(function(result) {
        vm.jackettEngines[engine.config.name].testing = false
        if (result.data.result == 'success' || result.status == 204) { // api2 currently returns 204 for tests
          vm.jackettEngines[engine.config.name].testOK = true
          vm.jackettEngines[engine.config.name].testMessage = 'success'
        } else {
          vm.jackettEngines[engine.config.name].testOK = false
          vm.jackettEngines[engine.config.name].testMessage = (result.data.error) ? result.data.error : 'Error, unknown reason.'
        }
      }, function(err) {
        vm.jackettEngines[engine.config.name].testOK = false
        if (err.status == -1) {
          vm.jackettEngines[engine.config.name].testMessage = ['Status:', err.status, 'Reason:', 'Unknown, probably the Jackett Service or App is not active.'].join(' ')
        } else {
          vm.jackettEngines[engine.config.name].testMessage = ['Status:', err.status, 'Reason:', err.statusText || 'Error, unknown reason.'].join(' ')
        }
        vm.jackettEngines[engine.config.name].testing = false
      })
    }

    // disable either a jackett or native SE
    vm.disable = function(engine) {
      TorrentSearchEngines.disableSearchEngine(engine)
    }

    // enable either a jackett or native SE
    vm.enable = function(engine) {
      TorrentSearchEngines.enableSearchEngine(engine)
    }

    // open a dialogue to add (or update) a jackett DB entity
    vm.openDialog = function(jackett, addNew) {
      dialogs.create('templates/dialogs/jackettSearchEngine.html', 'jackettSearchEngineDialogCtrl as jse', {
        engine: jackett,
        isNew: addNew
      }, {
        size: 'lg'
      })
    }

    // is this the default SE ?
    vm.isDefault = function(engineName) {
      return (engineName === TorrentSearchEngines.getDefaultEngineName())
    }
  }
])

DuckieTV.controller('jackettSearchEngineDialogCtrl', ['$scope', '$uibModalInstance', 'data', 'TorrentSearchEngines', 'FormlyLoader',
  function($scope, $modalInstance, data, TorrentSearchEngines, FormlyLoader) {
    var vm = this
    vm.jackett = new Jackett()
    vm.isNew = data.isNew == 1

    if (data.engine && !data.isNew) {
      vm.jackett = TorrentSearchEngines.getJackettFromCache(data.engine.config.name)
    }

    FormlyLoader.load('JackettSearchEngine').then(function(form) {
      vm.model = vm.jackett
      // turn integer into boolean for check-box
      vm.model.torznabEnabled = vm.model.torznabEnabled == 1
      vm.model.isNew = vm.isNew
      vm.fields = form
    })

    vm.save = function() {
      vm.model.enabled = vm.model.enabled ? 1 : 0
      var apiVersion = 1
      if (vm.model.torznab.indexOf('/api/v2.') > -1) {
        apiVersion = 2
      }

      var config
      if (apiVersion == 1) {
        config = {
          'isJackett': true,
          'apiVersion': apiVersion,
          'mirror': vm.model.torznab.substr(0, vm.model.torznab.indexOf('torznab')) + 'Admin/search',
          'name': vm.model.name,
          'test': vm.model.torznab.substr(0, vm.model.torznab.indexOf('torznab')) + 'Admin/test_indexer',
          'torznab': vm.model.torznab + '/api?t=search&cat=&apikey=' + vm.model.apiKey + '&q=',
          'tracker': vm.model.torznab.substr(vm.model.torznab.indexOf('torznab') + 8),
          'useTorznab': !!(vm.model.torznabEnabled)
        }
      } else {
        // API 2
        config = {
          'isJackett': true,
          'apiVersion': apiVersion,
          'apiKey': vm.model.apiKey,
          'mirror': vm.model.torznab.replace(vm.model.torznab.substr(vm.model.torznab.indexOf('/indexers/') + 10), 'all') + '/results',
          'name': vm.model.name,
          'test': vm.model.torznab.replace('/results/torznab/', '/test'),
          'torznab': vm.model.torznab,
          'tracker': vm.model.torznab.substr(vm.model.torznab.indexOf('/indexers/') + 10).replace('/results/torznab/', ''),
          'useTorznab': !!(vm.model.torznabEnabled)
        }
      }

      vm.model.json = JSON.stringify(config)
      vm.model.torznabEnabled = vm.model.torznabEnabled ? 1 : 0 // turn check-box boolean back into integer
      vm.model.Persist().then(function() {
        TorrentSearchEngines.removeJackettFromCache(vm.model.name)
        TorrentSearchEngines.addJackettEngine(vm.model)
        vm.jackettEngines = TorrentSearchEngines.getJackettEngines()
        $modalInstance.close()
        $scope.$destroy()
      })
    }

    vm.cancel = function() {
      $modalInstance.close()
      $scope.$destroy()
    }
  }
])
