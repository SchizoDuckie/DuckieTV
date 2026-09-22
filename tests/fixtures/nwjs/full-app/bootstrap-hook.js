'use strict'

var errors = []
window.addEventListener('error', function(event) { errors.push(String(event.error && event.error.stack || event.message)) })
window.addEventListener('unhandledrejection', function(event) { errors.push(String(event.reason && event.reason.stack || event.reason)) })

setTimeout(function() {
  var button = document.querySelector('#storage-startup-error button')
  if (button && localStorage.getItem('duckietv.storage.choice') !== 'fresh') button.click()
}, 1000)

setTimeout(function() {
  var injector = window.angular && angular.element(document).injector()
  var result = {
    runtime: process.versions.nw,
    injector: Boolean(injector),
    storageState: localStorage.getItem('duckietv.storage.state'),
    errors: errors
  }
  if (injector) {
    result.standalone = injector.get('SettingsService').isStandalone()
  }
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2))
  nw.App.quit()
}, 10000)
