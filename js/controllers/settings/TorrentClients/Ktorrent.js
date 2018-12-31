DuckieTV.controller('ktorrentCtrl', ['Ktorrent', 'SettingsService', 'FormlyLoader',
  function(Ktorrent, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('ktorrent.server'),
        port: SettingsService.get('ktorrent.port'),
        use_auth: SettingsService.get('ktorrent.use_auth'),
        username: SettingsService.get('ktorrent.username'),
        password: SettingsService.get('ktorrent.password'),
        hideUseAuth: true
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return Ktorrent.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      Ktorrent.Disconnect()
      Ktorrent.setConfig(vm.model)
      Ktorrent.connect().then(function(connected) {
        console.info('Ktorrent connected! (save settings)', connected)
        vm.error = null
        Ktorrent.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('Ktorrent connect error!', error)
      })
    }
  }
])
