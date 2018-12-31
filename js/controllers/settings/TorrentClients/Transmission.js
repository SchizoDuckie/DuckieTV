DuckieTV.controller('tbtCtrl', ['Transmission', 'SettingsService', 'FormlyLoader',
  function(Transmission, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('transmission.server'),
        port: SettingsService.get('transmission.port'),
        path: SettingsService.get('transmission.path'),
        use_auth: SettingsService.get('transmission.use_auth'),
        username: SettingsService.get('transmission.username'),
        password: SettingsService.get('transmission.password'),
        progressX100: SettingsService.get('transmission.progressX100')
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return Transmission.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      Transmission.Disconnect()
      Transmission.setConfig(vm.model)
      Transmission.connect().then(function(connected) {
        console.info('Transmission connected! (save settings)', connected)
        vm.error = null
        Transmission.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('Transmission connect error!', error)
      })
    }
  }
])
