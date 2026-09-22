'use strict'

window.addEventListener('load', function() {
  window.DuckieTVStorageReady.then(function() { return CRUD.executeQuery('SELECT name FROM Series WHERE TRAKT_ID=?', [882244]) }).then(function(result) {
    var pass = result.rows.length === 1 && result.rows[0].name === 'Shutdown synthetic'
    require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({ pass: pass, rows: result.rows }))
    nw.App.quit()
  }).catch(function(error) {
    require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({ pass: false, error: String(error.stack || error) }))
    nw.App.quit()
  })
})
