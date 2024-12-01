DuckieTV.controller('qbt41plusCtrl', ['qBittorrent41plus', 'SettingsService', 'FormlyLoader',
  function(qBittorrent41plus, SettingsService, FormlyLoader) {
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
      return qBittorrent41plus.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      qBittorrent41plus.Disconnect()
      qBittorrent41plus.setConfig(vm.model)
      qBittorrent41plus.connect().then(function(connected) {
        console.info('qBittorrent 4.1+ connected! (save settings)', connected)
        vm.error = null
        qBittorrent41plus.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('qBittorrent 4.1+ connect error!', error)
      })
    }
  }
])
