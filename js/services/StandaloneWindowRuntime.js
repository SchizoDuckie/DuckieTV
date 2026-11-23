/**
 * Shared NW.js window operations for the tray and window settings. The
 * remembered normal or maximized state survives hiding the window to the tray.
 */
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
    shouldStartInTray: function() {
      // Login launch is independent of the user's normal startup window choice.
      return localStorage.getItem('standalone.startupMinimized') === 'Y' ||
        (nw.App.argv || []).indexOf('--duckietv-start-in-tray') !== -1
    },
    /** Restore the window and its Dock or taskbar presence before focusing it. */
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
    /**
     * Handle an NW.js close event. An explicit Quit always invokes the caller's
     * shutdown callback. A close to the tray creates a way back before hiding.
     */
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
