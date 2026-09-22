'use strict'

function finish(result) { require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2)); nw.App.quit() }
CRUD.setAdapter(new CRUD.SQLiteAdapter('seriesguide_chrome')).then(async function() {
  var db = CRUD.EntityManager.getAdapter().db
  var statements = [
    ['INSERT INTO Series (ID_Serie,name,TRAKT_ID,dlPath,customIncludes,firstaired) VALUES (?,?,?,?,?,?)', [77, 'Synthetic Δ série', 55077, '/synthetic path/电视', 'unicode-é', 946684800000]],
    ['INSERT INTO Seasons (ID_Season,ID_Serie,seasonnumber,TRAKT_ID) VALUES (?,?,?,?)', [88, 77, 1, 66088]],
    ['INSERT INTO Episodes (ID_Episode,ID_Serie,ID_Season,episodenumber,seasonnumber,TRAKT_ID,watched,watchedAt,downloaded,magnetHash) VALUES (?,?,?,?,?,?,?,?,?,?)', [99, 77, 88, 1, 1, 77099, 1, 1690000000123, 1, '0123456789abcdef0123456789abcdef01234567']],
    ['INSERT INTO Fanart (ID_Fanart,TVDB_ID,poster,json) VALUES (?,?,?,?)', [101, 123, 'synthetic-poster', '{"sample":true}']],
    ['INSERT INTO TMDBFanart (id,entity_type,tmdb_id,poster,added) VALUES (?,?,?,?,?)', [102, 1, 456, 'synthetic-image', 1690000000123]],
    ['INSERT INTO Jackett (ID_Jackett,name,torznab,enabled,torznabEnabled,apiKey,json) VALUES (?,?,?,?,?,?,?)', [103, 'Synthetic Indexer', 'http://127.0.0.1:9999/synthetic', 1, 1, 'synthetic-only-key', '{"capabilities":[]}']]
  ]
  for (var pair of statements) await db.execute(pair[0], pair[1])
  localStorage.setItem('synthetic.migration.credentials', '{"username":"probe","password":"synthetic-only"}')
  localStorage.setItem('synthetic.migration.exact', '  unicode é\nline\t"quote"  ')
  var counts = {}
  for (var table of ['Series', 'Seasons', 'Episodes', 'Fanart', 'TMDBFanart', 'Jackett']) counts[table] = (await db.execute('SELECT COUNT(*) AS count FROM ' + table)).rows[0].count
  setTimeout(function() { finish({ pass: Object.keys(counts).every(function(table) { return counts[table] === 1 }), origin: location.origin, counts: counts }) }, 100)
}).catch(function(error) { finish({ pass: false, error: String(error.stack || error) }) })
setTimeout(function() { finish({ pass: false, timeout: true }) }, 20000)
