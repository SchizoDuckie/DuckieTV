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
      getWindow().show()
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
