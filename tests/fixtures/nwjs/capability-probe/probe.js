'use strict'

function capability(action) {
  return Promise.resolve().then(action).then(function(detail) {
    return { status: 'PASS', detail: detail === undefined ? true : detail }
  }).catch(function(error) {
    return { status: 'FAIL', detail: String(error && (error.stack || error.message) || error) }
  })
}

function query(database, sql, bindings) {
  return new Promise(function(resolve, reject) {
    database.transaction(function(transaction) {
      transaction.executeSql(sql, bindings || [], function(tx, result) {
        var rows = []
        for (var i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i))
        resolve({ rows: rows, rowsAffected: result.rowsAffected, insertId: result.insertId })
      }, function(tx, error) {
        reject(error)
        return true
      })
    }, reject)
  })
}

function probeWebSQL(phase) {
  if (typeof openDatabase !== 'function') throw new Error('openDatabase is unavailable')
  var database = openDatabase('duckietv_nw_probe', '1.0', 'DuckieTV NW probe', 1024 * 1024)
  if (phase === 'create') {
    return query(database, 'DROP TABLE IF EXISTS probe').then(function() {
      return query(database, 'CREATE TABLE probe (id INTEGER PRIMARY KEY, value TEXT NOT NULL)')
    }).then(function() {
      return query(database, 'INSERT INTO probe (id, value) VALUES (?, ?)', [1, 'persisted'])
    }).then(function(result) {
      if (result.rowsAffected !== 1 || result.insertId !== 1) throw new Error('Unexpected insert metadata')
      return query(database, 'SELECT id, value FROM probe')
    }).then(assertStoredRow)
  }
  return query(database, 'SELECT id, value FROM probe').then(assertStoredRow)
}

function assertStoredRow(result) {
  if (result.rows.length !== 1 || result.rows[0].id !== 1 || result.rows[0].value !== 'persisted') {
    throw new Error('Persisted row did not match')
  }
  return { row: result.rows[0], rowsAffected: result.rowsAffected }
}

function probeBackground() {
  return new Promise(function(resolve, reject) {
    var getBackgroundPage = chrome.runtime && chrome.runtime.getBackgroundPage
    if (typeof getBackgroundPage !== 'function') return reject(new Error('chrome.runtime.getBackgroundPage unavailable'))
    getBackgroundPage(function(background) {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
      if (!background || !background.duckieTVProbeBackground || !background.duckieTVProbeBackground.loaded) {
        return reject(new Error('Background page did not expose readiness'))
      }
      var port = chrome.runtime.connect({ name: 'duckietv-nw-probe' })
      var timeout = setTimeout(function() {
        port.disconnect()
        reject(new Error('Background port did not reply'))
      }, 3000)
      port.onMessage.addListener(function(message) {
        clearTimeout(timeout)
        port.disconnect()
        if (!message.background || message.probe !== 'ping') return reject(new Error('Unexpected background reply'))
        resolve({
          hasDocument: background.duckieTVProbeBackground.hasDocument,
          portRoundTrip: true,
          argv: background.duckieTVProbeBackground.argv,
          appArgv: background.duckieTVProbeBackground.appArgv,
          relativeRequire: background.duckieTVProbeBackground.relativeRequire
        })
      })
      port.postMessage({ probe: 'ping' })
    })
  })
}

function probeNotification() {
  if (!chrome.notifications || typeof chrome.notifications.create !== 'function') throw new Error('chrome.notifications.create unavailable')
  return new Promise(function(resolve, reject) {
    chrome.notifications.create('duckietv-nw-probe', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('probe-icon.svg'),
      title: 'DuckieTV probe',
      message: 'Runtime capability check'
    }, function(id) {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message))
      chrome.notifications.clear(id, function() { resolve({ created: Boolean(id), cleared: true }) })
    })
  })
}

function probeNodeSQLite(phase) {
  var fs = require('fs')
  var path = require('path')
  var sqlite = require('node:sqlite')
  var filename = path.join(nw.App.dataPath, 'duckietv-nw-probe.sqlite')
  if (phase === 'create') fs.rmSync(filename, { force: true })
  var database = new sqlite.DatabaseSync(filename)
  if (phase === 'create') {
    database.exec('CREATE TABLE probe (id INTEGER PRIMARY KEY, value TEXT)')
    database.prepare('INSERT INTO probe (id, value) VALUES (?, ?)').run(1, 'persisted')
  }
  var row = database.prepare('SELECT id, value FROM probe').get()
  database.close()
  if (!row || row.id !== 1 || row.value !== 'persisted') throw new Error('node:sqlite persisted query failed')
  return { DatabaseSync: typeof sqlite.DatabaseSync === 'function', persisted: true }
}

async function probeQueuedClose() {
  var path = require('node:path')
  var fixtureDirectory = require('./probe-node.cjs').dirname
  var module = require(path.resolve(fixtureDirectory, '..', '..', '..', '..', 'js', 'nwjs', 'database.cjs'))
  var filename = path.join(nw.App.dataPath, 'duckietv-close-probe.sqlite3')
  require('node:fs').rmSync(filename, { force: true })
  var database = module.createConnection('close-probe', { filename: filename, dataPath: nw.App.dataPath })
  await database.connect()
  await database.execute('CREATE TABLE probe (value TEXT)')
  var acceptedWrite = database.execute('INSERT INTO probe (value) VALUES (?)', ['drained'])
  var closing = database.close()
  var settled = await Promise.allSettled([acceptedWrite, closing])
  if (settled.some(function(result) { return result.status !== 'fulfilled' })) throw new Error('Accepted write did not drain before close')
  var reopened = module.createConnection('close-probe', { filename: filename, dataPath: nw.App.dataPath })
  await reopened.connect()
  var rows = await reopened.execute('SELECT value FROM probe')
  await reopened.close()
  if (rows.rows.length !== 1 || rows.rows[0].value !== 'drained') throw new Error('Drained write was not persisted')
  return { acceptedWriteDrained: true, reopenPersisted: true }
}

function probeNativeShell() {
  var win = nw.Window.get()
  var menu = new nw.Menu()
  var clipboard = nw.Clipboard.get()
  var tray = new nw.Tray({ title: 'DuckieTV probe' })
  tray.remove()
  return {
    window: Boolean(win && typeof win.show === 'function'),
    tray: typeof nw.Tray === 'function',
    menu: Boolean(menu),
    clipboard: Boolean(clipboard),
    shell: Boolean(nw.Shell && typeof nw.Shell.openExternal === 'function')
  }
}

window.addEventListener('load', function() {
  var fs = require('fs')
  var output = process.env.NW_PROBE_OUTPUT
  var phase = process.env.NW_PROBE_PHASE
  var directoryInput = document.createElement('input')
  directoryInput.type = 'file'
  directoryInput.setAttribute('nwdirectory', '')

  Promise.all([
    capability(function() { return probeWebSQL(phase) }),
    capability(function() { return probeNodeSQLite(phase) }),
    capability(probeQueuedClose),
    capability(probeBackground),
    capability(probeNotification),
    capability(probeNativeShell)
  ]).then(function(results) {
    var manifest = chrome.runtime && chrome.runtime.getManifest ? chrome.runtime.getManifest() : null
    var evidence = {
      phase: phase,
      runtime: {
        nw: process.versions.nw,
        node: process.versions.node,
        chromium: process.versions.chromium,
        platform: process.platform,
        arch: process.arch
      },
      application: {
        origin: location.origin,
        protocol: location.protocol,
        dataPath: nw.App.dataPath,
        dirname: typeof __dirname === 'undefined' ? null : __dirname,
        requireMain: require.main && require.main.filename,
        startPath: nw.App.startPath,
        manifestName: manifest && manifest.name,
        directoryInput: directoryInput.hasAttribute('nwdirectory'),
        onInstalled: Boolean(chrome.runtime && chrome.runtime.onInstalled)
      },
      capabilities: {
        websql: results[0],
        nodeSqlite: results[1],
        queuedClose: results[2],
        background: results[3],
        notifications: results[4],
        nativeShell: results[5]
      }
    }
    fs.writeFileSync(output, JSON.stringify(evidence, null, 2) + '\n')
    nw.App.quit()
  }).catch(function(error) {
    fs.writeFileSync(output, JSON.stringify({ phase: phase, fatal: String(error.stack || error) }, null, 2) + '\n')
    nw.App.quit()
  })
})
