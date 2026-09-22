'use strict'

function finish(result) {
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2))
  nw.App.quit()
}

window.addEventListener('load', function() {
window.DuckieTVStorageReady.then(async function() {
  var series = new Serie()
  series.set('name', 'NW test synthetic')
  series.set('TRAKT_ID', 771122)
  var insert = await series.Persist()
  series.set('name', 'NW test updated')
  var update = await series.Persist()
  var found = await CRUD.Find('Serie', { TRAKT_ID: 771122 })
  var removed = await series.Delete()
  var afterDelete = await CRUD.Find('Serie', { TRAKT_ID: 771122 })
  finish({
    runtime: process.versions.nw,
    pass: insert.Action === 'inserted' && update.Action === 'updated' &&
      found.length === 1 && found[0].get('name') === 'NW test updated' &&
      removed.Action === 'deleted' && series.getID() === false && afterDelete.length === 0
  })
}).catch(function(error) { finish({ pass: false, error: String(error.stack || error) }) })
})
setTimeout(function() { finish({ pass: false, timeout: true }) }, 20000)
