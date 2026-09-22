describe('StandaloneWindowRuntime', function() {
  var StandaloneWindowRuntime, win

  beforeEach(function() {
    localStorage.removeItem('standalone.position')
    win = {
      show: jasmine.createSpy('show'),
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
    expect(win.minimize).toHaveBeenCalled()
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
