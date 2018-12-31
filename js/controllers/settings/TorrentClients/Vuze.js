DuckieTV.controller('vuzeCtrl', ['Vuze', 'SettingsService', 'FormlyLoader',
  function(Vuze, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('vuze.server'),
        port: SettingsService.get('vuze.port'),
        path: SettingsService.get('vuze.path'),
        use_auth: SettingsService.get('vuze.use_auth'),
        username: SettingsService.get('vuze.username'),
        password: SettingsService.get('vuze.password'),
        progressX100: SettingsService.get('vuze.progressX100'),
        hidePath: true
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return Vuze.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      Vuze.Disconnect()
      Vuze.setConfig(vm.model)
      Vuze.connect().then(function(connected) {
        console.info('Vuze connected! (save settings)', connected)
        vm.error = null
        Vuze.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('Vuze connect error!', error)
      })
    }
  }
])
