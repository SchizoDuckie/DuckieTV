DuckieTV.controller('aria2Ctrl', ['Aria2', 'SettingsService', 'FormlyLoader',
  function(Aria2, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('aria2.server'),
        port: SettingsService.get('aria2.port'),
        token: SettingsService.get('aria2.token')
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return Aria2.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      Aria2.Disconnect()
      Aria2.setConfig(vm.model)
      Aria2.connect().then(function(connected) {
        console.info('Aria2 connected! (save settings)', connected)
        vm.error = null
        Aria2.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('Aria2 connect error!', error)
      })
    }
  }
])
