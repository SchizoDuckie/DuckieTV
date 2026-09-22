'use strict'

setTimeout(async function() {
  var result = { pass: false }
  try {
    await window.DuckieTVStorageReady
    var rows = (await CRUD.executeQuery("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name='Series'")).rows
    result.pass = localStorage.getItem('duckietv.storage.state') === 'native-v1-ready' && rows[0].count === 1 && !document.querySelector('#storage-startup-error button')
  } catch (error) {
    result.error = String(error && error.stack || error)
  }
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2))
  nw.App.quit()
}, 2000)
