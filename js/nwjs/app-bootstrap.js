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
      if (error.code === 'DUCKIETV_STORAGE_CHOICE_REQUIRED') {
        var fresh = document.createElement('button')
        fresh.type = 'button'
        fresh.className = 'btn btn-danger'
        fresh.textContent = 'Start Fresh'
        fresh.addEventListener('click', function() {
          localStorage.setItem('duckietv.storage.choice', 'fresh')
          chrome.runtime.reload()
        })
        message.appendChild(document.createTextNode(' '))
        message.appendChild(fresh)
        var migrate = document.createElement('button')
        migrate.type = 'button'
        migrate.className = 'btn btn-default'
        migrate.textContent = 'Import Existing Library'
        migrate.addEventListener('click', function() {
          var destination = require('node:path').dirname(nw.App.dataPath)
          message.textContent = 'Close DuckieTV, then follow HACKING.md “Migrate an NW.js 0.87 profile”. Destination profile: ' + destination
          var copy = document.createElement('button')
          copy.type = 'button'
          copy.className = 'btn btn-default'
          copy.textContent = 'Copy Destination Path'
          copy.addEventListener('click', function() { nw.Clipboard.get().set(destination, 'text') })
          message.appendChild(document.createTextNode(' '))
          message.appendChild(copy)
        })
        message.appendChild(document.createTextNode(' '))
        message.appendChild(migrate)
      }
    }
    if (globalThis.nw && nw.Window) nw.Window.get().show()
  })
})()
