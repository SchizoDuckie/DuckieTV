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

window.DuckieTVStorageReady = (window.DuckieTVStoragePreflight || Promise.resolve()).then(function(preflight) {
  return CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome', databaseOptions))
}).then(function() {
  if (typeof openDatabase !== 'function') localStorage.setItem('duckietv.storage.state', 'native-v1-ready')
})
