DuckieTV.controller('delugeCtrl', ['Deluge', 'SettingsService', 'FormlyLoader',
  function(Deluge, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    vm.isConnected = function() {
      return Deluge.isConnected()
    }

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('deluge.server'),
        port: SettingsService.get('deluge.port'),
        use_auth: SettingsService.get('deluge.use_auth'),
        password: SettingsService.get('deluge.password'),
        hideUseAuth: true
      }

      vm.fields = fields
    })

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      Deluge.Disconnect()
      Deluge.setConfig(vm.model)
      Deluge.connect().then(function(connected) {
        console.info('Deluge connected! (save settings)', connected)
        vm.error = null
        Deluge.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('Deluge connect error!', error)
      })
    }
  }
])
