DuckieTV.controller('qbt52plusCtrl', ['qBittorrent52plus', 'SettingsService', 'FormlyLoader',
  function(qBittorrent52plus, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('qbittorrent52plus.server'),
        port: SettingsService.get('qbittorrent52plus.port'),
        apikey: SettingsService.get('qbittorrent52plus.apikey')
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return qBittorrent52plus.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      qBittorrent52plus.Disconnect()
      qBittorrent52plus.setConfig(vm.model)
      qBittorrent52plus.connect().then(function(connected) {
        console.info('qBittorrent 5.2+ connected! (save settings)', connected)
        vm.error = null
        qBittorrent52plus.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('qBittorrent 5.2+ connect error!', error)
      })
    }
  }
])
