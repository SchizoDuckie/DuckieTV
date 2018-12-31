DuckieTV.controller('biglybtCtrl', ['BiglyBT', 'SettingsService', 'FormlyLoader',
  function(BiglyBT, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('biglybt.server'),
        port: SettingsService.get('biglybt.port'),
        path: SettingsService.get('biglybt.path'),
        use_auth: SettingsService.get('biglybt.use_auth'),
        username: SettingsService.get('biglybt.username'),
        password: SettingsService.get('biglybt.password'),
        progressX100: SettingsService.get('biglybt.progressX100'),
        hidePath: true
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return BiglyBT.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      BiglyBT.Disconnect()
      BiglyBT.setConfig(vm.model)
      BiglyBT.connect().then(function(connected) {
        console.info('BiglyBT connected! (save settings)', connected)
        vm.error = null
        BiglyBT.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('BiglyBT connect error!', error)
      })
    }
  }
])
