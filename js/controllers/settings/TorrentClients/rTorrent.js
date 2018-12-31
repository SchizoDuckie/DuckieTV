DuckieTV.controller('rTorrentCtrl', ['rTorrent', 'SettingsService', 'FormlyLoader',
  function(rTorrent, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('rtorrent.server'),
        port: SettingsService.get('rtorrent.port'),
        path: SettingsService.get('rtorrent.path')
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return rTorrent.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      rTorrent.Disconnect()
      rTorrent.setConfig(vm.model)
      rTorrent.connect().then(function(connected) {
        console.info('rTorrent connected! (save settings)', connected)
        vm.error = null
        rTorrent.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('rTorrent connect error!', error)
      })
    }
  }
])
