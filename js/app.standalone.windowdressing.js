/**
 * Window decorations and position storage for DuckieTV standalone.
 * Stores window position in localStorage on app close
 * Restores window position when available in localStorage
 * Auto minimizes app when indicated in localStorage
 * Tracks native window movement, resize, maximize and close state.
 */
DuckieTV.run(['SettingsService', 'StandaloneWindowRuntime', function (SettingsService, StandaloneWindowRuntime) {
  if (!SettingsService.isStandalone()) {
    return
  }

  var win = StandaloneWindowRuntime.getWindow()
  var pos

  if (localStorage.getItem('standalone.position')) {
    pos = JSON.parse(localStorage.getItem('standalone.position'))
    win.resizeTo(parseInt(pos.width), parseInt(pos.height))
    win.moveTo(parseInt(pos.x), parseInt(pos.y))

    console.debug('window state: state=%s,h=%i,w=%i,x=%i,y=%i', pos.state, pos.height, pos.width, pos.x, pos.y);

    if (pos.state == 'maximized') {
      setTimeout(function () {
        if (localStorage.getItem('standalone.startupMinimized') !== 'Y') {
          StandaloneWindowRuntime.maximize()
        }
      }, 230)
    }
  }

  if (localStorage.getItem('standalone.startupMinimized') !== 'Y') {
    setTimeout(function () {
      StandaloneWindowRuntime.show()
    }, 120)
  }

  function bindWindowState() {
    document.body.classList.add('standalone')

    // Save window state on resize and move with a 500ms debounce as the events fire continously while resizing or moving
    var windowMoveTimeout = false
    win.on('resize', function () {
      if (windowMoveTimeout !== false) {
        clearTimeout(windowMoveTimeout)
      }

      windowMoveTimeout = setTimeout(function () {
        saveWindowState()
      }, 500)
    })

    win.on('move', function () {
      if (windowMoveTimeout !== false) {
        clearTimeout(windowMoveTimeout)
      }

      windowMoveTimeout = setTimeout(function () {
        saveWindowState()
      }, 500)
    })

    win.on('close', saveWindowState)

    function saveWindowState() {
      console.debug('saving window state: state=%s,h=%i,w=%i,x=%i,y=%i', StandaloneWindowRuntime.getState(), window.outerHeight, window.outerWidth, window.screenX, window.screenY)
      localStorage.setItem('standalone.position', JSON.stringify({
        width: window.outerWidth,
        height: window.outerHeight,
        x: window.screenX,
        y: window.screenY,
        state: StandaloneWindowRuntime.getState()
      }))
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bindWindowState)
  } else {
    bindWindowState()
  }
}])
