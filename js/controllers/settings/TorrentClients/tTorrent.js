DuckieTV.controller('tTorrentCtrl', ['tTorrent', 'SettingsService', 'FormlyLoader',
  function(tTorrent, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('ttorrent.server'),
        port: SettingsService.get('ttorrent.port'),
        use_auth: SettingsService.get('ttorrent.use_auth'),
        username: SettingsService.get('ttorrent.username'),
        password: SettingsService.get('ttorrent.password'),
        hideUseAuth: false
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return tTorrent.isConnected()
    }

    vm.test = function() {
      vm.error = false
      tTorrent.Disconnect()
      tTorrent.setConfig(vm.model)
      tTorrent.connect().then(function(connected) {
        console.info('tTorrent  connected! (save settings)', connected)
        vm.error = null
        tTorrent.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('tTorrent  connect error!', error)
      })
    }
  }
])
