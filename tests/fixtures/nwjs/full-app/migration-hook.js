'use strict'

function finish(result) { require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2)); nw.App.quit() }
window.addEventListener('load', function() {
  window.DuckieTVStorageReady.then(async function() {
    var checks = await Promise.all([
      CRUD.executeQuery('SELECT name,TRAKT_ID,dlPath,customIncludes FROM Series WHERE ID_Serie=77'),
      CRUD.executeQuery('SELECT COUNT(*) AS count FROM Seasons'), CRUD.executeQuery('SELECT COUNT(*) AS count FROM Episodes'),
      CRUD.executeQuery('SELECT COUNT(*) AS count FROM Fanart'), CRUD.executeQuery('SELECT tmdb_id FROM TMDBFanart WHERE id=102'),
      CRUD.executeQuery('SELECT COUNT(*) AS count FROM Jackett')
    ])
    var series = checks[0].rows[0]
    var values = { series: series, seasons: checks[1].rows[0].count, episodes: checks[2].rows[0].count, fanart: checks[3].rows[0].count, tmdbId: checks[4].rows[0].tmdb_id, jackett: checks[5].rows[0].count, exact: localStorage.getItem('synthetic.migration.exact') }
    finish({ pass: series.name === 'Synthetic Δ série' && series.TRAKT_ID === 55077 && series.dlPath === '/synthetic path/电视' && series.customIncludes === 'unicode-é' && values.seasons === 1 && values.episodes === 1 && values.fanart === 1 && values.tmdbId === 456 && values.jackett === 1 && values.exact === '  unicode é\nline\t"quote"  ', values: values })
  }).catch(function(error) { finish({ pass: false, error: String(error.stack || error) }) })
})
setTimeout(function() { finish({ pass: false, timeout: true }) }, 20000)
