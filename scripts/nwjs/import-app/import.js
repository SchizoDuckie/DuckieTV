'use strict'

;(function() {
  var crypto = require('node:crypto')
  var fs = require('node:fs')
  var path = require('node:path')
  var vm = require('node:vm')
  var bundlePath = process.env.DUCKIETV_IMPORT_BUNDLE
  var output = process.env.DUCKIETV_IMPORT_OUTPUT
  var databasePath = path.join(nw.App.dataPath, 'seriesguide_chrome.sqlite3')
  var journalPath = path.join(nw.App.dataPath, 'migration-journal.json')
  var stateKey = 'duckietv.storage.state'

  function hash(value) {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
  }

  /** Publish each stage by renaming a complete journal into place. */
  function writeJournal(journal) {
    var temporary = journalPath + '.tmp'
    fs.writeFileSync(temporary, JSON.stringify(journal, null, 2) + '\n', { mode: 384 })
    fs.renameSync(temporary, journalPath)
  }

  function storageMatches(bundle, expectedState) {
    return Object.keys(bundle.localStorage).every(function(key) { return localStorage.getItem(key) === bundle.localStorage[key] }) &&
      localStorage.getItem('duckietv.storage.migratedFrom') === bundle.source.nw &&
      localStorage.getItem(stateKey) === expectedState
  }

  function restoreStorage(bundle, state) {
    localStorage.clear()
    Object.keys(bundle.localStorage).sort().forEach(function(key) { localStorage.setItem(key, bundle.localStorage[key]) })
    localStorage.setItem('duckietv.storage.migratedFrom', bundle.source.nw)
    localStorage.setItem(stateKey, state)
  }

  /**
   * Read the application entity schema in a sandbox so the importer can use
   * its table definitions and versions without starting the CRUD adapter.
   */
  function loadCatalog() {
    var sandbox = {
      console: console,
      Promise: Promise,
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      localStorage: { getItem: function() { return null }, setItem: function() {} }
    }
    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync(path.join(global.DuckieTVMigrationRoot, 'js/vendor/CRUD.js'), 'utf8'), sandbox, { filename: 'CRUD.js' })
    vm.runInContext(fs.readFileSync(path.join(global.DuckieTVMigrationRoot, 'js/CRUD.entities.js'), 'utf8'), sandbox, { filename: 'CRUD.entities.js' })
    return Object.keys(sandbox.CRUD.EntityManager.entities).map(function(name) {
      var entity = sandbox.CRUD.EntityManager.entities[name]
      return {
        table: entity.table,
        primary: entity.primary,
        fields: entity.fields,
        createStatement: entity.createStatement,
        version: entity.migrations ? Math.max.apply(Math, Object.keys(entity.migrations).map(Number)) : 1
      }
    })
  }

  /**
   * Reject an incompatible export before clearing the destination. Check
   * runtime identity, checksums, the expected schema, and episode references.
   */
  function validateBundle(bundle, catalog) {
    if (bundle.format !== 'duckietv-nwjs-migration' || bundle.version !== 1) throw new Error('Unsupported migration bundle')
    if (!bundle.source || bundle.source.nw !== '0.87.0' || bundle.source.origin !== 'chrome-extension://bagblfnohpiddokbpaacecffdboomafe') throw new Error('Untrusted legacy runtime identity')
    if (process.versions.nw !== '0.116.0' || process.versions.node !== '26.7.0' || process.versions.chromium !== '153.0.8010.12') throw new Error('Unexpected target runtime identity')
    var unsigned = Object.assign({}, bundle)
    delete unsigned.sha256
    if (hash(unsigned) !== bundle.sha256) throw new Error('Migration bundle checksum mismatch')
    var storageKeys = Object.keys(bundle.localStorage)
    if (storageKeys.length > 10000) throw new Error('Migration localStorage inventory is too large')
    var storageSize = 0
    storageKeys.forEach(function(key) {
      var value = bundle.localStorage[key]
      if (typeof value !== 'string' || key.length > 4096 || value.length > 16 * 1024 * 1024) throw new Error('Invalid migration localStorage value')
      storageSize += key.length + value.length
    })
    if (storageSize > 50 * 1024 * 1024) throw new Error('Migration localStorage payload is too large')
    if (storageKeys.some(function(key) { return key.indexOf('duckietv.storage.') === 0 })) throw new Error('Migration bundle contains reserved storage keys')
    if (bundle.tables.length !== catalog.length) throw new Error('Migration table inventory mismatch')

    catalog.forEach(function(entity) {
      var table = bundle.tables.find(function(candidate) { return candidate.table === entity.table })
      if (!table) throw new Error('Missing migration table ' + entity.table)
      if (table.primary !== entity.primary || table.version !== entity.version || table.count !== table.rows.length) throw new Error('Migration metadata mismatch for ' + entity.table)
      if (table.rows.length > 2000000) throw new Error('Migration table is too large: ' + entity.table)
      var expectedFields = entity.fields.map(function(field) { return field.toLowerCase() }).sort()
      var actualFields = table.columns.map(function(field) { return field.toLowerCase() }).sort()
      if (JSON.stringify(expectedFields) !== JSON.stringify(actualFields)) throw new Error('Migration column inventory mismatch for ' + entity.table)
      table.rows.forEach(function(row) {
        if (!Array.isArray(row) || row.length !== table.columns.length) throw new Error('Migration row width mismatch for ' + entity.table)
        row.forEach(function(value) {
          if (value !== null && typeof value !== 'string' && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error('Invalid migration scalar in ' + entity.table)
        })
      })
      if (hash({ columns: table.columns, rows: table.rows }) !== table.sha256) throw new Error('Migration table checksum mismatch for ' + entity.table)
    })

    function values(tableName, field) {
      var table = bundle.tables.find(function(candidate) { return candidate.table === tableName })
      var index = table.columns.map(function(column) { return column.toLowerCase() }).indexOf(field.toLowerCase())
      return table.rows.map(function(row) { return row[index] })
    }
    var series = new Set(values('Series', 'ID_Serie'))
    var seasons = new Set(values('Seasons', 'ID_Season'))
    values('Seasons', 'ID_Serie').forEach(function(id) { if (!series.has(id)) throw new Error('Orphan season in migration bundle') })
    var episodeSeries = values('Episodes', 'ID_Serie')
    var episodeSeasons = values('Episodes', 'ID_Season')
    episodeSeries.forEach(function(id, index) {
      if (!series.has(id) || (episodeSeasons[index] !== null && !seasons.has(episodeSeasons[index]))) throw new Error('Orphan episode in migration bundle')
    })
  }

  function quoted(identifier) {
    return '"' + identifier.replace(/"/g, '""') + '"'
  }

  /**
   * Create the tables, stamp their versions, and copy rows in one transaction.
   * Map column names case-insensitively from Web SQL to the entity schema.
   */
  function importBundle(bundle, catalog, database) {
    var statements = []
    catalog.forEach(function(entity) {
      var table = bundle.tables.find(function(candidate) { return candidate.table === entity.table })
      statements.push({ sql: entity.createStatement, bindings: [] })
      statements.push({ sql: 'INSERT INTO duckietv_schema (table_name, version) VALUES (?, ?)', bindings: [entity.table, entity.version] })
      var sourceIndexes = {}
      table.columns.forEach(function(column, index) { sourceIndexes[column.toLowerCase()] = index })
      var columns = entity.fields.map(quoted).join(', ')
      var placeholders = entity.fields.map(function() { return '?' }).join(', ')
      table.rows.forEach(function(row) {
        statements.push({
          sql: 'INSERT INTO ' + quoted(entity.table) + ' (' + columns + ') VALUES (' + placeholders + ')',
          bindings: entity.fields.map(function(field) { return row[sourceIndexes[field.toLowerCase()]] })
        })
      })
    })
    return database.batch(statements)
  }

  /**
   * Compare committed rows in the export's column and primary-key order, then
   * check SQLite integrity and relationships before allowing activation.
   */
  function verifyImported(bundle, catalog, database) {
    return catalog.reduce(function(promise, entity) {
      return promise.then(function() {
        var source = bundle.tables.find(function(candidate) { return candidate.table === entity.table })
        var columns = source.columns.map(quoted).join(', ')
        return database.execute('SELECT ' + columns + ' FROM ' + quoted(entity.table) + ' ORDER BY ' + quoted(entity.primary)).then(function(result) {
          var rows = result.rows.map(function(row) {
            var keys = {}
            Object.keys(row).forEach(function(key) { keys[key.toLowerCase()] = key })
            return source.columns.map(function(column) {
              var key = keys[column.toLowerCase()]
              if (key === undefined) throw new Error('Imported result omitted column ' + column + ' from ' + entity.table)
              return row[key]
            })
          })
          if (rows.length !== source.count || hash({ columns: source.columns, rows: rows }) !== source.sha256) {
            throw new Error('Imported data verification failed for ' + entity.table)
          }
        })
      })
    }, Promise.resolve()).then(function() {
      return database.execute('PRAGMA integrity_check').then(function(result) {
        if (result.rows.length !== 1 || result.rows[0].integrity_check !== 'ok') throw new Error('Imported database integrity check failed')
      })
    }).then(function() {
      return Promise.all([
        database.execute('SELECT COUNT(*) AS count FROM Seasons s LEFT JOIN Series r ON r.ID_Serie = s.ID_Serie WHERE r.ID_Serie IS NULL'),
        database.execute('SELECT COUNT(*) AS count FROM Episodes e LEFT JOIN Series r ON r.ID_Serie = e.ID_Serie LEFT JOIN Seasons s ON s.ID_Season = e.ID_Season WHERE r.ID_Serie IS NULL OR (e.ID_Season IS NOT NULL AND s.ID_Season IS NULL)')
      ]).then(function(results) {
        if (results[0].rows[0].count !== 0 || results[1].rows[0].count !== 0) throw new Error('Imported relationship validation failed')
      })
    })
  }

  window.addEventListener('load', function() {
    var journal
    var database
    Promise.resolve().then(function() {
      if (!bundlePath || !output) throw new Error('Import bundle and output paths are required')
      var bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'))
      var catalog = loadCatalog()
      validateBundle(bundle, catalog)
      var existingJournal = fs.existsSync(journalPath) ? JSON.parse(fs.readFileSync(journalPath, 'utf8')) : null
      var databaseExists = [databasePath, databasePath + '-wal', databasePath + '-shm'].some(function(filename) { return fs.existsSync(filename) })
      var resumableStages = ['database-importing', 'database-validated', 'storage-restoring', 'storage-restored', 'activation-pending', 'activation-verifying', 'failed']
      if (existingJournal && existingJournal.bundleSha256 !== bundle.sha256) throw new Error('Destination belongs to a different migration bundle')
      if (existingJournal && existingJournal.version !== 1) throw new Error('Unsupported migration journal version')
      // A user may have changed their library since activation. A completed
      // journal makes reruns report success without replaying the export.
      if (existingJournal && existingJournal.stage === 'complete') {
        if (!fs.existsSync(databasePath)) throw new Error('Completed migration database is missing')
        if (localStorage.getItem(stateKey) !== 'native-v1-ready') throw new Error('Completed migration activation marker is missing')
        fs.writeFileSync(output, JSON.stringify({ result: 'PASS', alreadyComplete: true, bundleSha256: bundle.sha256 }, null, 2) + '\n', { mode: 384 })
        return null
      }
      if (existingJournal && resumableStages.indexOf(existingJournal.stage) === -1) throw new Error('Unknown migration journal stage: ' + existingJournal.stage)
      // Write the ready marker on one launch and confirm it on the next. A
      // process exit can interrupt Chromium's asynchronous storage flush.
      if (existingJournal && existingJournal.stage === 'activation-pending') {
        if (!fs.existsSync(databasePath)) throw new Error('Migration activation database is missing')
        restoreStorage(bundle, 'native-v1-ready')
        existingJournal.stage = 'activation-verifying'
        writeJournal(existingJournal)
        return null
      }
      if (existingJournal && existingJournal.stage === 'activation-verifying') {
        if (!storageMatches(bundle, 'native-v1-ready')) {
          existingJournal.stage = 'activation-pending'
          writeJournal(existingJournal)
          return null
        }
        existingJournal.stage = 'complete'
        writeJournal(existingJournal)
        fs.writeFileSync(output, JSON.stringify({ result: 'PASS', bundleSha256: bundle.sha256, activatedAfterRestart: true }, null, 2) + '\n', { mode: 384 })
        return null
      }
      if (!existingJournal) {
        var awaitingChoiceKeys = ['runtime.event', 'install.notify', 'duckietv.storage.choice']
        var unexpectedDestinationKeys = Object.keys(localStorage).filter(function(key) { return awaitingChoiceKeys.indexOf(key) === -1 })
        if (databaseExists || unexpectedDestinationKeys.length) throw new Error('Migration destination is not empty')
        localStorage.clear()
      }
      // An unfinished import for this bundle can be rebuilt from the export.
      // The activation branches above keep a verified database in place.
      if (existingJournal) {
        ;[databasePath, databasePath + '-wal', databasePath + '-shm'].forEach(function(filename) { fs.rmSync(filename, { force: true }) })
        localStorage.clear()
      }
      if (existingJournal && existingJournal.stage === 'complete') return
      journal = { version: 1, bundleSha256: bundle.sha256, stage: 'database-importing' }
      writeJournal(journal)
      localStorage.setItem(stateKey, 'native-v1-importing')
      var nativeDatabase = global.DuckieTVMigrationRequire('js/nwjs/database.cjs')
      database = nativeDatabase.createConnection('seriesguide_chrome', { filename: databasePath, dataPath: nw.App.dataPath })
      return database.connect().then(function() { return importBundle(bundle, catalog, database) }).then(function() {
        return verifyImported(bundle, catalog, database)
      }).then(function() {
        journal.stage = 'database-validated'
        writeJournal(journal)
        return database.close()
      }).then(function() {
        journal.stage = 'storage-restoring'
        writeJournal(journal)
        restoreStorage(bundle, 'native-v1-importing')
        journal.stage = 'activation-pending'
        writeJournal(journal)
      })
    }).then(function() {
      nw.App.quit()
    }).catch(function(error) {
      Promise.resolve(database ? database.close().catch(function() {}) : null).then(function() {
        try {
          if (journal && journal.stage !== 'complete') {
            journal.stage = 'failed'
            journal.error = String(error.message || error)
            writeJournal(journal)
          }
        } catch (diagnosticError) { console.error(diagnosticError) }
        try {
          if (output) fs.writeFileSync(output + '.error.json', JSON.stringify({ error: String(error.message || error) }) + '\n', { mode: 384 })
        } catch (diagnosticError) { console.error(diagnosticError) }
      }).finally(function() { nw.App.quit() })
    })
  })
})()
