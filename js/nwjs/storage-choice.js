'use strict'

;(function() {
  if (typeof openDatabase === 'function') {
    window.DuckieTVStoragePreflight = Promise.resolve({ backend: 'websql' })
    return
  }

  var stateKey = 'duckietv.storage.state'
  var readyState = 'native-v1-ready'
  var initializingState = 'native-v1-fresh-initializing'
  var args = (globalThis.nw && nw.App && nw.App.argv) || []
  var startFresh = args.indexOf('--duckietv-start-fresh') > -1 || process.env.DUCKIETV_START_FRESH === '1'
  var recoverFresh = args.indexOf('--duckietv-recover-fresh') > -1 || process.env.DUCKIETV_RECOVER_FRESH === '1'
  var state = localStorage.getItem(stateKey)

  if (state === readyState) {
    window.DuckieTVStoragePreflight = Promise.resolve({ backend: 'node:sqlite', state: state })
    return
  }

  if (startFresh) {
    var ownedKeys = [stateKey, 'duckietv.storage.createdAt']
    var unexpectedKeys = Object.keys(localStorage).filter(function(key) {
      return ownedKeys.indexOf(key) === -1 && !(recoverFresh && key.indexOf('database.version.') === 0)
    })
    var path = require('node:path')
    var fs = require('node:fs')
    var databasePath = path.join(nw.App.dataPath, 'seriesguide_chrome.sqlite3')
    var databaseExists = [databasePath, databasePath + '-wal', databasePath + '-shm'].some(function(filename) {
      return fs.existsSync(filename)
    })
    var canRecover = recoverFresh && state === initializingState
    if (unexpectedKeys.length || (state && !canRecover) || (databaseExists && !canRecover)) {
      window.DuckieTVStoragePreflight = Promise.reject(new Error('Start Fresh requires an empty dedicated profile'))
      return
    }
    if (canRecover) {
      ;[databasePath, databasePath + '-wal', databasePath + '-shm'].forEach(function(filename) {
        fs.rmSync(filename, { force: true })
      })
      Object.keys(localStorage).filter(function(key) { return key.indexOf('database.version.') === 0 }).forEach(function(key) {
        localStorage.removeItem(key)
      })
    }
    localStorage.setItem(stateKey, initializingState)
    localStorage.setItem('duckietv.storage.createdAt', new Date().toISOString())
    window.DuckieTVStoragePreflight = Promise.resolve({ backend: 'node:sqlite', state: initializingState, fresh: true })
    return
  }

  var error = new Error('Choose Import or Start Fresh before opening DuckieTV with the new storage profile')
  error.code = 'DUCKIETV_STORAGE_CHOICE_REQUIRED'
  window.DuckieTVStoragePreflight = Promise.reject(error)
})()
