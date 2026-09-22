'use strict'

var errors = []
window.addEventListener('error', function(event) { errors.push(String(event.error && event.error.stack || event.message)) })
window.addEventListener('unhandledrejection', function(event) { errors.push(String(event.reason && event.reason.stack || event.reason)) })

setTimeout(function() {
  var button = document.querySelector('#storage-startup-error button')
  if (button && localStorage.getItem('duckietv.storage.choice') !== 'fresh') {
    var win = nw.Window.get()
    var actions = []
    var originalMinimize = win.minimize
    var originalMaximize = win.maximize
    var originalRestore = win.restore
    var originalQuit = nw.App.quit
    win.minimize = function() { actions.push('minimize') }
    win.maximize = function() { actions.push('maximize') }
    win.restore = function() { actions.push('restore') }
    nw.App.quit = function() { actions.push('quit') }
    document.getElementById('minimize').click()
    document.getElementById('maximize').click()
    document.getElementById('unmaximize').click()
    document.getElementById('close').click()
    win.minimize = originalMinimize
    win.maximize = originalMaximize
    win.restore = originalRestore
    nw.App.quit = originalQuit
    require('node:fs').writeFileSync(require('node:path').join(nw.App.dataPath, 'failure-controls-result'), document.body.classList.contains('standalone') && actions.join(',') === 'minimize,maximize,restore,quit' ? 'pass' : 'fail')
    button.click()
  } else if (localStorage.getItem('duckietv.storage.state') === 'native-v1-ready') {
    var now = String(Date.now())
    localStorage.setItem('trakttv.lastupdated', now)
    localStorage.setItem('trakttv.lastupdated.trending', now)
  }
}, 1000)

setTimeout(function() {
  var injector = window.angular && angular.element(document).injector()
  var result = {
    runtime: process.versions.nw,
    injector: Boolean(injector),
    storageState: localStorage.getItem('duckietv.storage.state'),
    errors: errors
  }
  try { result.firstRunControls = require('node:fs').readFileSync(require('node:path').join(nw.App.dataPath, 'failure-controls-result'), 'utf8') } catch (error) { result.firstRunControls = null }
  if (injector) {
    result.standalone = injector.get('SettingsService').isStandalone()
  }
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2))
  nw.App.quit()
}, 10000)
