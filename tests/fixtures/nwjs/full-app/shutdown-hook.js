'use strict'

window.addEventListener('load', function() {
  window.DuckieTVStorageReady.then(function() {
    var acceptedWrite = CRUD.executeQuery('INSERT INTO Series(name,TRAKT_ID) VALUES (?,?)', ['Shutdown synthetic', 882244])
    var shutdown = CRUD.EntityManager.getAdapter().db.shutdown()
    return Promise.all([acceptedWrite, shutdown]).then(function() {
      return CRUD.executeQuery('SELECT 1').then(function() { throw new Error('Query was accepted after shutdown') }, function() { return true })
    })
  }).then(function() {
    require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({ pass: true, rejectedAfterShutdown: true }))
    nw.App.quit()
  }).catch(function(error) {
    require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({ pass: false, error: String(error.stack || error) }))
    nw.App.quit()
  })
})
