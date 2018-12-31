/**
 * Synology DS-Video main control interface
 * Lists devices and library and control options
 */
DuckieTV.controller('SynologyDSVideoCtrl', ['SynologyAPI',
  function(SynologyAPI) {
    var vm = this

    vm.library = null
    vm.devices = null
    vm.folders = null

    SynologyAPI.Library().then(function(library) {
      vm.library = library
    })

    SynologyAPI.DeviceList().then(function(devices) {
      vm.devices = devices
    })

    SynologyAPI.Folder().then(function(folders) {
      vm.folders = folders
    })

    vm.play = function(file) {
      SynologyAPI.PlayFile(file, vm.devices[0])
    }

    vm.getFilesForFolder = function(folder) {
      return SynologyAPI.Folder({
        id: folder.id
      }).then(function(result) {
        folder.files = result
        return folder
      })
    }
  }
])
