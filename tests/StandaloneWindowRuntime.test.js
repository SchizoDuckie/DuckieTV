describe('StandaloneWindowRuntime', function() {
  var StandaloneWindowRuntime, win

  beforeEach(function() {
    localStorage.removeItem('standalone.position')
    win = {
      show: jasmine.createSpy('show'),
      hide: jasmine.createSpy('hide'),
      focus: jasmine.createSpy('focus'),
      setShowInTaskbar: jasmine.createSpy('setShowInTaskbar'),
      minimize: jasmine.createSpy('minimize'),
      maximize: jasmine.createSpy('maximize'),
      unmaximize: jasmine.createSpy('unmaximize')
    }
    window.nw = {
      Window: {
        get: jasmine.createSpy('get').and.returnValue(win)
      }
    }
  })

  afterEach(function() {
    localStorage.removeItem('standalone.position')
    delete window.nw
  })

  function loadRuntime() {
    module('DuckieTV')
    inject(function(_StandaloneWindowRuntime_) {
      StandaloneWindowRuntime = _StandaloneWindowRuntime_
    })
  }

  it('shares one lazily acquired NW window across operations', function() {
    loadRuntime()

    expect(window.nw.Window.get).not.toHaveBeenCalled()
    StandaloneWindowRuntime.show()
    StandaloneWindowRuntime.minimize()
    StandaloneWindowRuntime.getWindow()

    expect(window.nw.Window.get.calls.count()).toBe(1)
    expect(win.show).toHaveBeenCalled()
    expect(win.setShowInTaskbar).toHaveBeenCalledWith(true)
    expect(win.focus).toHaveBeenCalled()
    expect(win.minimize).toHaveBeenCalled()
  })

  it('removes the Dock or taskbar entry only while hidden in the tray', function() {
    loadRuntime()

    StandaloneWindowRuntime.hideToTray()
    expect(win.hide).toHaveBeenCalledBefore(win.setShowInTaskbar)
    expect(win.setShowInTaskbar).toHaveBeenCalledWith(false)

    StandaloneWindowRuntime.show()
    expect(win.setShowInTaskbar.calls.mostRecent().args).toEqual([true])
    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
  })

  it('quits on a macOS quit request even when close to tray is enabled', function() {
    loadRuntime()
    var createTray = jasmine.createSpy('createTray')
    var quit = jasmine.createSpy('quit')

    StandaloneWindowRuntime.handleClose('quit', true, createTray, quit)
    expect(quit).toHaveBeenCalled()
    expect(createTray).not.toHaveBeenCalled()
    expect(win.hide).not.toHaveBeenCalled()

    StandaloneWindowRuntime.handleClose(undefined, true, createTray, quit)
    expect(createTray).toHaveBeenCalled()
    expect(win.hide).toHaveBeenCalled()
  })

  it('owns maximized and normal state transitions', function() {
    loadRuntime()

    expect(StandaloneWindowRuntime.getState()).toBe('normal')
    StandaloneWindowRuntime.maximize()
    expect(StandaloneWindowRuntime.getState()).toBe('maximized')
    expect(win.maximize).toHaveBeenCalled()

    StandaloneWindowRuntime.restore()
    expect(StandaloneWindowRuntime.getState()).toBe('normal')
    expect(win.unmaximize).toHaveBeenCalled()
  })

  it('starts maximized from persisted geometry state', function() {
    localStorage.setItem('standalone.position', JSON.stringify({ state: 'maximized' }))
    loadRuntime()

    expect(StandaloneWindowRuntime.getState()).toBe('maximized')
  })

  it('falls back to normal for malformed persisted state', function() {
    localStorage.setItem('standalone.position', '{broken')
    loadRuntime()

    expect(StandaloneWindowRuntime.getState()).toBe('normal')
  })
})
