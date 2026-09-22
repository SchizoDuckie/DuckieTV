'use strict'

var errors = []
window.addEventListener('error', function(event) { errors.push(String(event.error && event.error.stack || event.message)) })
window.addEventListener('unhandledrejection', function(event) { errors.push(String(event.reason && event.reason.stack || event.reason)) })

setTimeout(function() {
  if (localStorage.getItem('duckietv.storage.state') === 'native-v1-ready') {
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
    firstRunControls: nw.App.manifest.window.frame === true && !document.querySelector('.windowChrome') && !document.body.classList.contains('storage-pending') && !document.querySelector('#storage-startup-error button') ? 'auto-fresh-pass' : 'fail',
    errors: errors
  }
  if (injector) result.standalone = injector.get('SettingsService').isStandalone()
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2))
  nw.App.quit()
}, 10000)
