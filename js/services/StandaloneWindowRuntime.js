DuckieTV.factory('StandaloneWindowRuntime', [function() {
  var win = null
  var state = readPersistedState()

  function readPersistedState() {
    var saved = localStorage.getItem('standalone.position')
    if (!saved) return 'normal'

    try {
      return angular.fromJson(saved).state === 'maximized' ? 'maximized' : 'normal'
    } catch (error) {
      return 'normal'
    }
  }

  function getWindow() {
    if (win === null) win = nw.Window.get()
    return win
  }

  return {
    getWindow: getWindow,
    getState: function() {
      return state
    },
    show: function() {
      var window = getWindow()
      window.setShowInTaskbar(true)
      window.show()
      window.focus()
    },
    hideToTray: function() {
      var window = getWindow()
      window.hide()
      window.setShowInTaskbar(false)
    },
    handleClose: function(reason, closeToTray, createTray, quit) {
      if (reason === 'quit' || !closeToTray) {
        quit()
        return
      }
      createTray()
      this.hideToTray()
    },
    minimize: function() {
      getWindow().minimize()
    },
    maximize: function() {
      getWindow().maximize()
      state = 'maximized'
    },
    restore: function() {
      getWindow().unmaximize()
      state = 'normal'
    }
  }
}])
