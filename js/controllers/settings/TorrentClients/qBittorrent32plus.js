DuckieTV.controller('qbt32plusCtrl', ['qBittorrent32plus', 'SettingsService', 'FormlyLoader',
  function(qBittorrent32plus, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('qbittorrent32plus.server'),
        port: SettingsService.get('qbittorrent32plus.port'),
        use_auth: SettingsService.get('qbittorrent32plus.use_auth'),
        username: SettingsService.get('qbittorrent32plus.username'),
        password: SettingsService.get('qbittorrent32plus.password')
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return qBittorrent32plus.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      qBittorrent32plus.Disconnect()
      qBittorrent32plus.setConfig(vm.model)
      qBittorrent32plus.connect().then(function(connected) {
        console.info('qBittorrent 3.2+ connected! (save settings)', connected)
        vm.error = null
        qBittorrent32plus.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('qBittorrent 3.2+ connect error!', error)
      })
    }
  }
])
