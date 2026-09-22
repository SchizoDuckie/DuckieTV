'use strict'

;(function() {
  var readiness = window.DuckieTVStorageReady || Promise.resolve()
  readiness.then(function() {
    angular.element(document).ready(function() {
      angular.bootstrap(document, ['DuckieTV'], { strictDi: true })
    })
  }).catch(function(error) {
    console.error('DuckieTV storage failed to start', error)
    var message = document.getElementById('storage-startup-error')
    if (message) {
      message.textContent = error.code === 'DUCKIETV_STORAGE_CHOICE_REQUIRED' ?
        'Choose Import or Start Fresh before opening this DuckieTV profile.' :
        'DuckieTV could not open its library: ' + String(error.message || error)
      message.style.display = 'block'
    }
    if (globalThis.nw && nw.Window) nw.Window.get().show()
  })
})()
