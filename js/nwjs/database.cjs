'use strict'

const path = require('node:path')
const { Worker } = require('node:worker_threads')

function normalizeBinding(value) {
  if (value === undefined) return null
  if (Object.prototype.toString.call(value) === '[object Date]' && typeof value.getTime === 'function') return value.getTime()
  if (typeof value === 'boolean') return value ? 1 : 0
  return value
}

class NWDatabaseConnection {
  constructor(name, options) {
    this.name = name
    this.options = options || {}
    this.worker = null
    this.pending = new Map()
    this.counter = 0
    this.connected = false
    this.closing = false
    this.closePromise = null
    this.lastInsertRowId = 0
  }

  connect() {
    if (this.connected) return Promise.resolve(this)
    if (this.worker) return this.ready

    const dataPath = this.options.dataPath || (globalThis.nw && nw.App && nw.App.dataPath)
    if (!dataPath) return Promise.reject(new Error('NW.js data path is unavailable'))
    const filename = this.options.filename || path.join(dataPath, this.name + '.sqlite3')
    this.worker = new Worker(path.join(__dirname, 'database-worker.cjs'), {
      workerData: { filename: filename }
    })
    this.worker.on('message', this.onMessage.bind(this))
    this.worker.on('error', this.onWorkerError.bind(this))
    this.worker.on('exit', this.onWorkerExit.bind(this))
    this.ready = this.request('connect', {}).then(function() {
      this.connected = true
      return this
    }.bind(this))
    return this.ready
  }

  execute(sql, bindings) {
    if (!this.worker || this.closing) return Promise.reject(new Error(this.closing ? 'Database is closing' : 'Database is not connected'))
    return this.ready.then(function() {
      return this.request('execute', {
        sql: sql,
        bindings: (bindings || []).map(normalizeBinding)
      })
    }.bind(this)).then(function(result) {
      if (result.insertId !== undefined) this.lastInsertRowId = result.insertId
      return result
    }.bind(this))
  }

  batch(statements) {
    if (!this.worker || this.closing) return Promise.reject(new Error(this.closing ? 'Database is closing' : 'Database is not connected'))
    return this.ready.then(function() {
      return this.request('batch', {
        statements: statements.map(function(statement) {
          return {
            sql: statement.sql,
            bindings: (statement.bindings || []).map(normalizeBinding)
          }
        })
      })
    }.bind(this))
  }

  getSchemaVersion(table) {
    return this.execute('SELECT version FROM duckietv_schema WHERE table_name = ?', [table]).then(function(result) {
      return result.rows.length ? Number(result.rows[0].version) : null
    })
  }

  setSchemaVersion(table, version) {
    return this.execute('INSERT INTO duckietv_schema (table_name, version) VALUES (?, ?) ON CONFLICT(table_name) DO UPDATE SET version = excluded.version', [table, Number(version)])
  }

  lastInsertId() {
    return this.lastInsertRowId
  }

  getDB() {
    return this
  }

  close() {
    if (this.closePromise) return this.closePromise
    if (!this.worker) return Promise.resolve()
    this.closing = true
    this.closePromise = this.ready.then(function() {
      return this.request('close', {}, true)
    }.bind(this)).finally(function() {
      if (this.worker) this.worker.terminate()
      this.worker = null
      this.connected = false
    }.bind(this))
    return this.closePromise
  }

  request(command, payload, allowWhileClosing) {
    if (!this.worker || (this.closing && !allowWhileClosing)) return Promise.reject(new Error(this.closing ? 'Database is closing' : 'Database worker is unavailable'))
    const id = ++this.counter
    return new Promise(function(resolve, reject) {
      this.pending.set(id, { resolve: resolve, reject: reject })
      this.worker.postMessage(Object.assign({ id: id, command: command }, payload))
    }.bind(this))
  }

  onMessage(message) {
    const pending = this.pending.get(message.id)
    if (!pending) return
    this.pending.delete(message.id)
    if (message.error) {
      const error = new Error(message.error.message)
      error.code = message.error.code
      error.stack = message.error.stack || error.stack
      pending.reject(error)
    } else {
      pending.resolve(message.result)
    }
  }

  onWorkerError(error) {
    this.rejectPending(error)
  }

  onWorkerExit(code) {
    if (this.pending.size) this.rejectPending(new Error('Database worker exited before pending requests settled with code ' + code))
    this.worker = null
    this.connected = false
  }

  rejectPending(error) {
    this.pending.forEach(function(pending) { pending.reject(error) })
    this.pending.clear()
  }
}

module.exports = {
  createConnection: function(name, options) {
    return new NWDatabaseConnection(name, options)
  },
  NWDatabaseConnection: NWDatabaseConnection
}
