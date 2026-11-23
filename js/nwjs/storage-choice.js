'use strict'

/**
 * Publish a preflight promise for the background CRUD bootstrap. Native
 * startup needs either a verified existing library or permission to initialize
 * an empty profile. The bootstrap marks a new library ready after schema setup.
 */
;(function() {
  try {
  if (typeof openDatabase === 'function') {
    window.DuckieTVStoragePreflight = Promise.resolve({ backend: 'websql' })
    return
  }

  var stateKey = 'duckietv.storage.state'
  var readyState = 'native-v1-ready'
  var initializingState = 'native-v1-fresh-initializing'
  var args = (globalThis.nw && nw.App && nw.App.argv) || []
  var choiceKey = 'duckietv.storage.choice'
  var fs = require('node:fs')
  var path = require('node:path')
  var profileRoot = path.dirname(nw.App.dataPath)
  var standardNamespace = path.basename(profileRoot) === 'DuckieTV-Standalone-SQLite'
  var legacyProfileRoot = path.join(path.dirname(profileRoot), 'DuckieTV-Standalone')
  var namespaceMarkerPath = path.join(nw.App.dataPath, 'duckietv-native-profile.json')
  var targetLegacyDatabasePath = path.join(nw.App.dataPath, 'databases')
  if (fs.existsSync(targetLegacyDatabasePath)) {
    window.DuckieTVStoragePreflight = Promise.reject(new Error('This profile contains legacy Web SQL data and cannot be opened by the new runtime'))
    return
  }
  if (!fs.existsSync(namespaceMarkerPath)) {
    fs.writeFileSync(namespaceMarkerPath, JSON.stringify({ schemaVersion: 1, name: 'DuckieTV-Standalone-SQLite' }) + '\n', { flag: 'wx', mode: 384 })
  } else {
    try {
      var namespaceMarker = JSON.parse(fs.readFileSync(namespaceMarkerPath, 'utf8'))
      if (namespaceMarker.schemaVersion !== 1 || namespaceMarker.name !== 'DuckieTV-Standalone-SQLite') throw new Error('Unexpected profile namespace marker')
    } catch (error) {
      window.DuckieTVStoragePreflight = Promise.reject(error)
      return
    }
  }
  var explicitFresh = args.indexOf('--duckietv-start-fresh') > -1 || process.env.DUCKIETV_START_FRESH === '1' || localStorage.getItem(choiceKey) === 'fresh'
  var recoverFresh = args.indexOf('--duckietv-recover-fresh') > -1 || process.env.DUCKIETV_RECOVER_FRESH === '1'
  var state = localStorage.getItem(stateKey)

  // Opening a missing SQLite file would create an empty library. Check that
  // the file exists and that any migration has completed activation.
  if (state === readyState) {
    var readyDatabasePath = path.join(nw.App.dataPath, 'seriesguide_chrome.sqlite3')
    if (!fs.existsSync(readyDatabasePath)) {
      window.DuckieTVStoragePreflight = Promise.reject(new Error('Ready DuckieTV profile is missing its native database'))
      return
    }
    if (localStorage.getItem('duckietv.storage.migratedFrom')) {
      var migrationPath = path.join(nw.App.dataPath, 'migration-journal.json')
      try {
        var migrationJournal = JSON.parse(fs.readFileSync(migrationPath, 'utf8'))
        if (migrationJournal.version !== 1 || migrationJournal.stage !== 'complete') throw new Error('Migration activation journal is incomplete')
      } catch (error) {
        window.DuckieTVStoragePreflight = Promise.reject(error)
        return
      }
    }
    window.DuckieTVStoragePreflight = Promise.resolve({ backend: 'node:sqlite', state: state })
    return
  }

  var legacyProfileDetected = false
  // Look for the sibling profile only at the default location. A custom
  // destination can still be migrated by passing it explicitly to the importer.
  if (standardNamespace) {
    try {
      var legacyProfileEntry = fs.lstatSync(legacyProfileRoot)
      legacyProfileDetected = legacyProfileEntry.isDirectory() || legacyProfileEntry.isSymbolicLink()
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  var startFresh = explicitFresh || !legacyProfileDetected

  if (startFresh) {
    var ownedKeys = [stateKey, 'duckietv.storage.createdAt', choiceKey, 'runtime.event', 'install.notify']
    var unexpectedKeys = Object.keys(localStorage).filter(function(key) {
      return ownedKeys.indexOf(key) === -1 && !(recoverFresh && key.indexOf('database.version.') === 0)
    })
    var databasePath = path.join(nw.App.dataPath, 'seriesguide_chrome.sqlite3')
    var databaseExists = [databasePath, databasePath + '-wal', databasePath + '-shm'].some(function(filename) {
      return fs.existsSync(filename)
    })
    // Only an explicitly requested recovery of our own interrupted fresh setup
    // may remove the partially initialized database and its version markers.
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
    localStorage.removeItem(choiceKey)
    localStorage.setItem(stateKey, initializingState)
    localStorage.setItem('duckietv.storage.createdAt', new Date().toISOString())
    window.DuckieTVStoragePreflight = Promise.resolve({ backend: 'node:sqlite', state: initializingState, fresh: true })
    return
  }

  var error = new Error('Choose Import or Start Fresh before opening DuckieTV with the new storage profile')
  error.code = 'DUCKIETV_STORAGE_CHOICE_REQUIRED'
  error.legacyProfilePath = legacyProfileRoot
  window.DuckieTVStoragePreflight = Promise.reject(error)
  } catch (error) {
    window.DuckieTVStoragePreflight = Promise.reject(error)
  }
})()
