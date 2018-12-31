DuckieTV.controller('qbtCtrl', ['qBittorrent', 'SettingsService', 'FormlyLoader',
  function(qBittorrent, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('qbittorrent.server'),
        port: SettingsService.get('qbittorrent.port'),
        use_auth: SettingsService.get('qbittorrent.use_auth'),
        username: SettingsService.get('qbittorrent.username'),
        password: SettingsService.get('qbittorrent.password')
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return qBittorrent.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      qBittorrent.Disconnect()
      qBittorrent.setConfig(vm.model)
      qBittorrent.connect().then(function(connected) {
        console.info('qBittorrent (pre3.2) connected! (save settings)', connected)
        vm.error = null
        qBittorrent.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('qBittorrent {pre3.2) connect error!', error)
      })
    }
  }
])
