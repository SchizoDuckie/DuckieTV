'use strict'

const path = require('node:path')
const { Worker } = require('node:worker_threads')

/**
 * Convert ORM bind values before sending the query to the SQLite worker.
 * Date values can come from the NW.js renderer, which has its own Date class.
 */
function normalizeBinding(value) {
  if (value === undefined) return null
  if (Object.prototype.toString.call(value) === '[object Date]' && typeof value.getTime === 'function') return value.getTime()
  if (typeof value === 'boolean') return value ? 1 : 0
  return value
}

/**
 * Promise-based connection used by the CRUD adapter and migration importer.
 * One worker owns the synchronous SQLite handle for each connection.
 */
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
    this.operationTail = Promise.resolve()
    this.lastInsertRowId = 0
  }

  /** Share one readiness promise across callers opening the same connection. */
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

  /**
   * Run one statement with positional bindings. Resolves to rows and an
   * affected-row count, with an insert ID when the statement inserted a row.
   */
  execute(sql, bindings) {
    if (!this.worker || this.closing) return Promise.reject(new Error(this.closing ? 'Database is closing' : 'Database is not connected'))
    return this.queueOperation(function() {
      return this.request('execute', {
        sql: sql,
        bindings: (bindings || []).map(normalizeBinding)
      }, true)
    }.bind(this)).then(function(result) {
      if (result.insertId !== undefined) this.lastInsertRowId = result.insertId
      return result
    }.bind(this))
  }

  /**
   * Run an ordered array of {sql, bindings} statements in one transaction.
   * Resolves to the statement results in order. A SQL failure rolls back the
   * entire batch.
   */
  batch(statements) {
    if (!this.worker || this.closing) return Promise.reject(new Error(this.closing ? 'Database is closing' : 'Database is not connected'))
    return this.queueOperation(function() {
      return this.request('batch', {
        statements: statements.map(function(statement) {
          return {
            sql: statement.sql,
            bindings: (statement.bindings || []).map(normalizeBinding)
          }
        })
      }, true)
    }.bind(this))
  }

  /**
   * Preserve call order across reads, writes, and batches. A rejected operation
   * still reaches its caller, while the queue remains available to later work.
   */
  queueOperation(operation) {
    const accepted = this.operationTail.then(function() {
      return this.ready.then(operation)
    }.bind(this))
    this.operationTail = accepted.catch(function() {})
    return accepted
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

  /**
   * Stop accepting statements, drain previously queued work, then close the
   * SQLite handle and terminate the worker. Concurrent closes share the result.
   */
  close() {
    if (this.closePromise) return this.closePromise
    if (!this.worker) return Promise.resolve()
    this.closing = true
    this.closePromise = this.operationTail.then(function() {
      return this.ready
    }.bind(this)).then(function() {
      return this.request('close', {}, true)
    }.bind(this)).finally(function() {
      if (this.worker) this.worker.terminate()
      this.worker = null
      this.connected = false
    }.bind(this))
    return this.closePromise
  }

  /**
   * Send a worker command and wait for its matching reply. The closing
   * allowance lets accepted statements reach SQLite while shutdown drains them.
   */
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
