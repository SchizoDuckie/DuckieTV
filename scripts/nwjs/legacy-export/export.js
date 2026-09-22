'use strict'

;(function() {
  var crypto = require('crypto')
  var fs = require('fs')
  var path = require('path')
  var vm = require('vm')
  var output = process.env.DUCKIETV_EXPORT_OUTPUT

  function loadCatalog() {
    var root = process.env.DUCKIETV_APP_ROOT
    if (!root) throw new Error('DUCKIETV_APP_ROOT is required')
    var sandbox = { console: console, Promise: Promise, setTimeout: setTimeout, clearTimeout: clearTimeout, localStorage: { getItem: function() {}, setItem: function() {} } }
    vm.createContext(sandbox)
    vm.runInContext(fs.readFileSync(path.join(root, 'js/vendor/CRUD.js'), 'utf8'), sandbox)
    vm.runInContext(fs.readFileSync(path.join(root, 'js/CRUD.entities.js'), 'utf8'), sandbox)
    return Object.keys(sandbox.CRUD.EntityManager.entities).map(function(name) {
      var entity = sandbox.CRUD.EntityManager.entities[name]
      return { table: entity.table, primary: entity.primary, fields: entity.fields, version: entity.migrations ? Math.max.apply(Math, Object.keys(entity.migrations).map(Number)) : 1 }
    })
  }

  function hash(value) {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
  }

  function query(database, sql) {
    return new Promise(function(resolve, reject) {
      database.readTransaction(function(transaction) {
        transaction.executeSql(sql, [], function(tx, result) {
          var rows = []
          for (var i = 0; i < result.rows.length; i++) rows.push(result.rows.item(i))
          resolve(rows)
        }, function(tx, error) {
          reject(error)
          return true
        })
      }, reject)
    })
  }

  function quote(identifier) {
    return '"' + identifier.replace(/"/g, '""') + '"'
  }

  function exportTable(database, definition) {
    var columns = definition.fields
    var inventoryQuery = 'SELECT * FROM ' + quote(definition.table) + ' UNION ALL SELECT ' + columns.map(function() { return 'NULL' }).join(', ') + ' LIMIT 1'
    return query(database, inventoryQuery).then(function(inventory) {
      if (!inventory.length) throw new Error('Could not inspect legacy table ' + definition.table)
      var actual = Object.keys(inventory[0]).map(function(column) { return column.toLowerCase() }).sort()
      var trusted = columns.map(function(column) { return column.toLowerCase() }).sort()
      if (JSON.stringify(actual) !== JSON.stringify(trusted)) throw new Error('Legacy column inventory mismatch for ' + definition.table)
      return query(database, 'SELECT ' + columns.map(quote).join(', ') + ' FROM ' + quote(definition.table) + ' ORDER BY ' + quote(definition.primary))
    }).then(function(rows) {
        var values = rows.map(function(row) {
          var keys = {}
          Object.keys(row).forEach(function(key) { keys[key.toLowerCase()] = key })
          return columns.map(function(column) {
            var key = keys[column.toLowerCase()]
            if (key === undefined) throw new Error('Legacy result omitted column ' + column + ' from ' + definition.table)
            return row[key]
          })
        })
        var content = { columns: columns, rows: values }
        return { table: definition.table, primary: definition.primary, version: definition.version, columns: columns, rows: values, count: values.length, sha256: hash(content) }
    })
  }

  window.addEventListener('load', function() {
    Promise.resolve().then(function() {
      if (!output) throw new Error('DUCKIETV_EXPORT_OUTPUT is required')
      if (typeof openDatabase !== 'function') throw new Error('Legacy WebSQL is unavailable')
      var expected = loadCatalog()
      var database = openDatabase('seriesguide_chrome', '1.0', '', 25 * 1024 * 1024)
      var storage = {}
      Object.keys(localStorage).sort().forEach(function(key) { storage[key] = localStorage.getItem(key) })
      expected.forEach(function(definition) {
        var version = Number(storage['database.version.' + definition.table])
        if (version !== definition.version) throw new Error('Unsupported schema version for ' + definition.table + ': ' + version)
      })
      return Promise.all(expected.map(function(definition) { return exportTable(database, definition) })).then(function(tables) {
        var payload = {
          format: 'duckietv-nwjs-migration',
          version: 1,
          source: { nw: process.versions.nw, node: process.versions.node, origin: location.origin },
          tables: tables,
          localStorage: storage
        }
        payload.sha256 = hash(payload)
        fs.writeFileSync(output, JSON.stringify(payload) + '\n', { flag: 'wx', mode: 384 })
      })
    }).then(function() {
      nw.App.quit()
    }).catch(function(error) {
      try {
        if (output) fs.writeFileSync(output + '.error.json', JSON.stringify({ error: String(error.message || error) }) + '\n', { mode: 384 })
      } catch (diagnosticError) { console.error(diagnosticError) }
      nw.App.quit()
    })
  })
})()
