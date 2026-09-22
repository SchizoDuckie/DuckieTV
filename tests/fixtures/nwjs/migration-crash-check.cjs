#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { execFileSync, spawn } = require('node:child_process')

const root = path.resolve(__dirname, '..', '..', '..')
const importApp = path.join(root, 'scripts', 'nwjs', 'import-app')
const options = {}
process.argv.slice(2).forEach(function(arg) {
  const match = /^--(binary|bundle|work)=(.+)$/.exec(arg)
  if (!match) throw new Error('Unknown argument: ' + arg)
  options[match[1]] = path.resolve(match[2])
})
if (process.platform !== 'darwin') throw new Error('The process-tree crash fixture is macOS-specific')
if (!options.binary || !options.bundle || !options.work) throw new Error('--binary, --bundle and --work are required')

const bundle = JSON.parse(fs.readFileSync(options.bundle, 'utf8'))
const app = path.join(options.work, 'crash-app')
const verifyApp = path.join(options.work, 'verify-app')
fs.rmSync(options.work, { recursive: true, force: true })
fs.mkdirSync(options.work, { recursive: true })
fs.cpSync(importApp, app, { recursive: true })
fs.cpSync(importApp, verifyApp, { recursive: true })

fs.writeFileSync(path.join(app, 'node-main.cjs'), [
  'require(' + JSON.stringify(path.join(importApp, 'node-main.cjs')) + ')',
  "const fs = require('node:fs')",
  'const renameSync = fs.renameSync',
  'fs.renameSync = function(source, destination) {',
  '  const result = renameSync.apply(this, arguments)',
  "  if (String(destination).endsWith('migration-journal.json') && JSON.parse(fs.readFileSync(destination, 'utf8')).stage === process.env.NW_TEST_CRASH_STAGE) {",
  "    fs.writeFileSync(process.env.NW_TEST_CRASH_MARKER, 'ready')",
  '    while (true) {}',
  '  }',
  '  return result',
  '}'
].join('\n') + '\n')
fs.writeFileSync(path.join(verifyApp, 'node-main.cjs'), 'require(' + JSON.stringify(path.join(importApp, 'node-main.cjs')) + ')\n')
fs.writeFileSync(path.join(verifyApp, 'import.js'), [
  "window.addEventListener('load', function() {",
  "  var fs = require('node:fs')",
  "  var bundle = JSON.parse(fs.readFileSync(process.env.DUCKIETV_IMPORT_BUNDLE, 'utf8'))",
  '  var mismatches = Object.keys(bundle.localStorage).filter(function(key) { return localStorage.getItem(key) !== bundle.localStorage[key] })',
  "  fs.writeFileSync(process.env.DUCKIETV_IMPORT_OUTPUT, JSON.stringify({ pass: mismatches.length === 0 && localStorage.getItem('duckietv.storage.state') === 'native-v1-ready', mismatches: mismatches }))",
  '  nw.App.quit()',
  '})'
].join('\n') + '\n')

function ownedPids(profile) {
  const exactArgument = '--user-data-dir=' + profile
  return execFileSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).split('\n').map(function(line) {
    const match = /^\s*(\d+)\s+(.*)$/.exec(line)
    return match && match[2].split(/\s+/).includes(exactArgument) ? Number(match[1]) : null
  }).filter(Boolean)
}

function killOwned(profile) {
  ownedPids(profile).forEach(function(pid) {
    try { process.kill(pid, 'SIGKILL') } catch (error) { if (error.code !== 'ESRCH') throw error }
  })
}

function launch(stage, kind) {
  return new Promise(function(resolve, reject) {
    const profile = path.join(options.work, 'profile-' + stage)
    const marker = path.join(options.work, stage + '.marker')
    const output = path.join(options.work, stage + (kind === 'verify' ? '-storage' : '') + '.json')
    const selectedApp = kind === 'crash' ? app : kind === 'verify' ? verifyApp : importApp
    const child = spawn(options.binary, ['--user-data-dir=' + profile, '--nwapp=' + selectedApp], {
      cwd: options.work,
      env: Object.assign({}, process.env, {
        DUCKIETV_IMPORT_BUNDLE: options.bundle,
        DUCKIETV_IMPORT_OUTPUT: output,
        NW_TEST_CRASH_STAGE: stage,
        NW_TEST_CRASH_MARKER: marker
      }),
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let log = ''
    let interrupted = false
    child.stdout.on('data', function(value) { log += value })
    child.stderr.on('data', function(value) { log += value })
    const poll = setInterval(function() {
      if (kind === 'crash' && fs.existsSync(marker)) {
        interrupted = true
        clearInterval(poll)
        killOwned(profile)
      }
    }, 10)
    const timer = setTimeout(function() { killOwned(profile) }, 15000)
    child.on('error', reject)
    child.on('close', function(code) {
      clearInterval(poll)
      clearTimeout(timer)
      if (interrupted) return resolve({ interrupted: true })
      if (code !== 0) return reject(new Error(kind + ' at ' + stage + ' exited ' + code + '\n' + log))
      if (fs.existsSync(output + '.error.json')) return reject(new Error(fs.readFileSync(output + '.error.json', 'utf8')))
      resolve({ interrupted: false, output: fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : null })
    })
  })
}

async function main() {
  const stages = ['database-importing', 'database-validated', 'storage-restoring', 'activation-pending', 'activation-verifying', 'complete']
  const results = []
  for (const stage of stages) {
    const profile = path.join(options.work, 'profile-' + stage)
    fs.rmSync(profile, { recursive: true, force: true })
    ;['.marker', '.json', '.json.error.json', '-storage.json'].forEach(function(suffix) { fs.rmSync(path.join(options.work, stage + suffix), { force: true }) })
    let interrupted = false
    for (let attempt = 0; attempt < 6 && !interrupted; attempt++) interrupted = (await launch(stage, 'crash')).interrupted
    if (!interrupted) throw new Error('Did not reach crash boundary ' + stage)
    const journal = JSON.parse(fs.readFileSync(path.join(profile, 'Default', 'migration-journal.json'), 'utf8'))
    if (journal.stage !== stage) throw new Error('Expected journal stage ' + stage + ', received ' + journal.stage)
    let recovered = false
    for (let attempt = 0; attempt < 6 && !recovered; attempt++) {
      const recovery = await launch(stage, 'recover')
      recovered = recovery.output && recovery.output.result === 'PASS'
    }
    if (!recovered) throw new Error('Migration did not recover from ' + stage)
    const storage = await launch(stage, 'verify')
    if (!storage.output || !storage.output.pass) throw new Error('localStorage differs after ' + stage + ': ' + JSON.stringify(storage.output))
    const database = new (require('node:sqlite').DatabaseSync)(path.join(profile, 'Default', 'seriesguide_chrome.sqlite3'), { readOnly: true })
    for (const table of bundle.tables) {
      const sql = 'SELECT ' + table.columns.map(function(column) { return '"' + column + '"' }).join(',') + ' FROM "' + table.table + '" ORDER BY "' + table.primary + '"'
      const rows = database.prepare(sql).all().map(function(row) {
        return table.columns.map(function(column) { return row[Object.keys(row).find(function(key) { return key.toLowerCase() === column.toLowerCase() })] })
      })
      if (JSON.stringify(rows) !== JSON.stringify(table.rows)) throw new Error('Database differs after ' + stage + ' for ' + table.table)
    }
    database.close()
    results.push({ stage: stage, pass: true, databaseEquality: true, localStorageEquality: true })
    console.log('PASS migration crash recovery ' + stage)
  }
  fs.writeFileSync(path.join(options.work, 'results.json'), JSON.stringify(results, null, 2) + '\n')
}

main().catch(function(error) { console.error(error.stack || error.message); process.exitCode = 1 })
