DuckieTV.controller('uTorrentWebUICtrl', ['uTorrentWebUI', 'SettingsService', 'FormlyLoader',
  function(uTorrentWebUI, SettingsService, FormlyLoader) {
    var vm = this
    vm.error = null

    FormlyLoader.load('TorrentClientSettings').then(function(fields) {
      vm.model = {
        server: SettingsService.get('utorrentwebui.server'),
        port: SettingsService.get('utorrentwebui.port'),
        use_auth: SettingsService.get('utorrentwebui.use_auth'),
        username: SettingsService.get('utorrentwebui.username'),
        password: SettingsService.get('utorrentwebui.password'),
        hideUseAuth: true
      }

      vm.fields = fields
    })

    vm.isConnected = function() {
      return uTorrentWebUI.isConnected()
    }

    vm.test = function() {
      vm.error = false
      // console.log("Testing settings");
      uTorrentWebUI.Disconnect()
      uTorrentWebUI.setConfig(vm.model)
      uTorrentWebUI.connect().then(function(connected) {
        console.info('uTorrent WEBUI connected! (save settings)', connected)
        vm.error = null
        uTorrentWebUI.saveConfig()
        window.location.reload()
      }, function(error) {
        vm.error = error
        console.error('uTorrent WEBUI connect error!', error)
      })
    }
  }
])
