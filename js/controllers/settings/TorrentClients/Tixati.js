DuckieTV.controller('tixatiCtrl', ['Tixati', 'SettingsService', 'FormlyLoader',
  function(Tixati, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('tixati.server'),
        port: SettingsService.get('tixati.port'),
        use_auth: SettingsService.get('tixati.use_auth'),
        username: SettingsService.get('tixati.username'),
        password: SettingsService.get('tixati.password'),
        hideUseAuth: true
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return Tixati.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      Tixati.Disconnect()
      Tixati.setConfig(vm.model)
      Tixati.connect().then(function(connected) {
        console.info('Tixati connected! (save settings)', connected)
        vm.error = null
        Tixati.saveConfig()
        window.location.reload()
      }, function(error) {
        if ('status' in error && 'statusText' in error) {
          vm.error = ['Tixati connect error!', 'Status:', error.status, 'Reason:', error.statusText || 'Unknown'].join(' ')
        } else {
          vm.error = error
        }
        console.error(vm.error)
      })
    }
  }
])
