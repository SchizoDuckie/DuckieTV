'use strict'

const { parentPort, workerData } = require('node:worker_threads')
const { DatabaseSync } = require('node:sqlite')

let database = null

/** Keep integers that exceed JavaScript's safe range as decimal strings. */
function serializeInteger(value) {
  if (typeof value !== 'bigint') return value
  if (value <= BigInt(Number.MAX_SAFE_INTEGER) && value >= BigInt(Number.MIN_SAFE_INTEGER)) return Number(value)
  return value.toString()
}

/**
 * Adapt node:sqlite results to the CRUD adapter's row and write result shapes.
 * Use prepared statement metadata to detect queries that return columns.
 */
function execute(sql, bindings) {
  const statement = database.prepare(sql)
  const columns = statement.columns()
  if (columns.length) {
    const rows = statement.all.apply(statement, bindings).map(function(row) {
      Object.keys(row).forEach(function(key) { row[key] = serializeInteger(row[key]) })
      return row
    })
    return { rows: rows, rowsAffected: 0 }
  }
  const result = statement.run.apply(statement, bindings)
  const output = {
    rows: [],
    rowsAffected: Number(result.changes)
  }
  if (/^\s*INSERT\b/i.test(sql) && result.changes > 0) output.insertId = serializeInteger(result.lastInsertRowid)
  return output
}

/** Commit schema changes, version records, and data together in one batch. */
function batch(statements) {
  database.exec('BEGIN IMMEDIATE')
  try {
    const results = statements.map(function(statement) {
      return execute(statement.sql, statement.bindings || [])
    })
    database.exec('COMMIT')
    return results
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

function errorPayload(error) {
  return {
    message: String(error.message || error),
    code: error.code,
    stack: error.stack
  }
}

parentPort.on('message', function(message) {
  try {
    let result
    switch (message.command) {
      case 'connect':
        if (!database) {
          database = new DatabaseSync(workerData.filename)
          database.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA trusted_schema = OFF; CREATE TABLE IF NOT EXISTS duckietv_schema (table_name TEXT PRIMARY KEY NOT NULL, version INTEGER NOT NULL)')
        }
        result = { connected: true }
        break
      case 'execute':
        if (!database) throw new Error('Database is not connected')
        result = execute(message.sql, message.bindings || [])
        break
      case 'batch':
        if (!database) throw new Error('Database is not connected')
        result = batch(message.statements || [])
        break
      case 'close':
        if (database) database.close()
        database = null
        result = { closed: true }
        break
      default:
        throw new Error('Unknown database command: ' + message.command)
    }
    parentPort.postMessage({ id: message.id, result: result })
  } catch (error) {
    parentPort.postMessage({ id: message.id, error: errorPayload(error) })
  }
})
