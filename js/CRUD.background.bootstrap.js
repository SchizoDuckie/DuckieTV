/**
 * Loaded after defining the CRUD.entities.
 * Boots up CRUD.js database init procedure to the SQLiteAdapter
 */

CRUD.DEBUG = false
if (localStorage.getItem('CRUD.DEBUG')) {
  CRUD.DEBUG = (localStorage.getItem('CRUD.DEBUG') === 'true')
}

var databaseOptions = {
  estimatedSize: 25 * 1024 * 1024
}

if (typeof openDatabase !== 'function') {
  var NWDatabase = global.DuckieTVRequireFromRoot('js/nwjs/database.cjs')
  databaseOptions.dataPath = nw.App.dataPath
  CRUD.Database.connectionFactory = NWDatabase.createConnection
}

var storagePreflight = window.DuckieTVStoragePreflight
if (typeof openDatabase !== 'function' && (!storagePreflight || typeof storagePreflight.then !== 'function')) {
  storagePreflight = Promise.reject(new Error('Background storage preflight was not initialized'))
}

window.DuckieTVStorageReady = (storagePreflight || Promise.resolve()).then(function(preflight) {
  return CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome', databaseOptions))
}).then(function() {
  if (typeof openDatabase !== 'function') localStorage.setItem('duckietv.storage.state', 'native-v1-ready')
})

var storageShutdownPromise
window.DuckieTVStorageShutdown = function() {
  if (storageShutdownPromise) return storageShutdownPromise
  storageShutdownPromise = window.DuckieTVStorageReady.then(function() {
    var adapter = CRUD.EntityManager.getAdapter()
    if (typeof openDatabase === 'function' || !adapter || !adapter.db || typeof adapter.db.close !== 'function') return
    return adapter.db.close()
  })
  return storageShutdownPromise
}
