#!/usr/bin/env node

'use strict'

// Migrate a copied legacy profile with the old NW.js runtime, then import its
// Web SQL data into a separate native SQLite profile for the new runtime.

const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')
const catalog = require('./runtime.json')

const root = path.resolve(__dirname, '..', '..')
const allowed = new Set(['source-profile', 'destination-profile', 'legacy-binary', 'target-binary'])

function options() {
  const result = {}
  process.argv.slice(2).forEach(function(arg) {
    const match = /^--([^=]+)=(.+)$/.exec(arg)
    if (!match || !allowed.has(match[1])) throw new Error('Unknown argument: ' + arg)
    result[match[1]] = match[2]
  })
  return result
}

function targetBinary() {
  const platform = process.platform === 'darwin' ? 'osx' : process.platform === 'win32' ? 'win' : 'linux'
  const directory = path.join(root, '_nwjs', 'nwjs-sdk-v' + catalog.version + '-' + platform + '-' + process.arch)
  if (process.platform === 'darwin') return path.join(directory, 'nwjs.app', 'Contents', 'MacOS', 'nwjs')
  return path.join(directory, process.platform === 'win32' ? 'nw.exe' : 'nw')
}

function lstatExists(filename) {
  try { fs.lstatSync(filename); return true } catch (error) { if (error.code === 'ENOENT') return false; throw error }
}

/**
 * Resolve symlinks in the existing part of a path. Keep missing path segments
 * so the destination can be compared with the source before it is created.
 */
function canonicalPath(filename) {
  let current = path.resolve(filename)
  const missing = []
  while (!lstatExists(current)) {
    missing.unshift(path.basename(current))
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }
  return path.join(fs.realpathSync(current), ...missing)
}

/**
 * Fingerprint profile files by relative path and contents so the original
 * and offline copy can be compared. Reject links that could leave the copy.
 */
function hashTree(directory) {
  const hash = crypto.createHash('sha256')
  function visit(current, relative) {
    fs.readdirSync(current, { withFileTypes: true }).sort(function(a, b) { return a.name.localeCompare(b.name) }).forEach(function(entry) {
      const absolute = path.join(current, entry.name)
      const child = path.join(relative, entry.name)
      if (entry.isDirectory()) return visit(absolute, child)
      hash.update(child + '\0')
      if (entry.isSymbolicLink()) throw new Error('Profile contains unsupported symbolic link: ' + child)
      else if (entry.isFile()) hash.update(fs.readFileSync(absolute))
    })
  }
  visit(directory, '')
  return hash.digest('hex')
}

function rejectSymlinks(directory) {
  if (!fs.existsSync(directory)) return
  function visit(current) {
    fs.readdirSync(current, { withFileTypes: true }).forEach(function(entry) {
      const absolute = path.join(current, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Destination profile contains unsupported symbolic link: ' + path.relative(directory, absolute))
      if (entry.isDirectory()) visit(absolute)
    })
  }
  visit(directory)
}

function run(binary, app, profile, environment) {
  return new Promise(function(resolve, reject) {
    const child = spawn(binary, ['--user-data-dir=' + profile, '--nwapp=' + app], {
      cwd: os.tmpdir(),
      env: Object.assign({}, process.env, environment),
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', function(data) { stdout += data })
    child.stderr.on('data', function(data) { stderr += data })
    const timeout = setTimeout(function() {
      child.kill('SIGKILL')
      reject(new Error('NW.js migration subprocess timed out'))
    }, 60000)
    child.on('error', function(error) { clearTimeout(timeout); reject(error) })
    child.on('exit', function(code, signal) {
      clearTimeout(timeout)
      if (code !== 0 || signal) return reject(new Error('NW.js migration subprocess failed code=' + code + ' signal=' + signal + '\n' + stdout + '\n' + stderr))
      resolve()
    })
  })
}

/**
 * Export a closed legacy profile from an offline copy and import the verified
 * bundle into a separate native profile. Write migration evidence after the
 * importer reports activation and the source passes the final hash check.
 */
async function main() {
  const config = options()
  ;['source-profile', 'destination-profile', 'legacy-binary'].forEach(function(name) {
    if (!config[name]) throw new Error('--' + name + ' is required')
  })
  const source = fs.realpathSync(path.resolve(config['source-profile']))
  const destination = canonicalPath(config['destination-profile'])
  const legacyBinary = path.resolve(config['legacy-binary'])
  const currentBinary = path.resolve(config['target-binary'] || targetBinary())
  if (!fs.statSync(source).isDirectory()) throw new Error('Source profile is not a directory')
  if (!fs.existsSync(legacyBinary) || !fs.existsSync(currentBinary)) throw new Error('A required runtime binary is missing')
  if (source === destination || destination.indexOf(source + path.sep) === 0 || source.indexOf(destination + path.sep) === 0) throw new Error('Source and destination profiles must be separate')
  ;['SingletonLock', 'SingletonCookie', 'SingletonSocket'].forEach(function(name) {
    if (lstatExists(path.join(source, name))) throw new Error('Source profile may still be open: ' + name + ' exists')
  })
  rejectSymlinks(destination)
  if (fs.existsSync(path.join(destination, 'Default', 'databases'))) throw new Error('Destination contains legacy Web SQL data')
  if (fs.existsSync(destination) && fs.readdirSync(destination).length) {
    const journal = path.join(destination, 'Default', 'migration-journal.json')
    const database = path.join(destination, 'Default', 'seriesguide_chrome.sqlite3')
    const namespaceMarker = path.join(destination, 'Default', 'duckietv-native-profile.json')
    if (!fs.existsSync(journal) && fs.existsSync(database)) throw new Error('Destination contains an unjournaled native database')
    if (!fs.existsSync(journal) && !fs.existsSync(namespaceMarker)) throw new Error('Nonempty destination is not a marked DuckieTV native profile')
    if (fs.existsSync(namespaceMarker)) {
      const marker = JSON.parse(fs.readFileSync(namespaceMarker, 'utf8'))
      if (marker.schemaVersion !== 1 || marker.name !== 'DuckieTV-Standalone-SQLite') throw new Error('Destination profile namespace marker is invalid')
    }
  }
  ;['SingletonLock', 'SingletonCookie', 'SingletonSocket'].forEach(function(name) {
    if (lstatExists(path.join(destination, name))) throw new Error('Destination profile may still be open: ' + name + ' exists')
  })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const work = path.join(root, '_nwjs', 'migration-work', stamp + '-' + process.pid)
  const copy = path.join(work, 'source-copy')
  const evidence = path.join(root, 'dist', 'nwjs-evidence')
  const bundle = path.join(work, 'migration-bundle.json')
  const importResult = path.join(evidence, 'migration-import-' + stamp + '.json')
  fs.mkdirSync(work, { recursive: true })
  fs.mkdirSync(evidence, { recursive: true })

  const sourceHashBefore = hashTree(source)
  fs.cpSync(source, copy, { recursive: true, dereference: false, verbatimSymlinks: true, errorOnExist: true })
  const copyHash = hashTree(copy)
  if (copyHash !== sourceHashBefore) throw new Error('Offline profile copy hash does not match source')

  let exported
  try {
    await run(legacyBinary, path.join(root, 'scripts', 'nwjs', 'legacy-export'), copy, {
      DUCKIETV_EXPORT_OUTPUT: bundle,
      DUCKIETV_APP_ROOT: root
    })
    if (!fs.existsSync(bundle)) {
      const errorFile = bundle + '.error.json'
      throw new Error(fs.existsSync(errorFile) ? JSON.parse(fs.readFileSync(errorFile, 'utf8')).error : 'Legacy exporter produced no bundle')
    }
    exported = JSON.parse(fs.readFileSync(bundle, 'utf8'))
    if (exported.source.nw !== '0.87.0') throw new Error('Legacy export used unexpected NW.js version ' + exported.source.nw)

    fs.mkdirSync(destination, { recursive: true })
    // Each importer launch advances the journal. Activation needs separate
    // launches to confirm that Chromium persisted the restored localStorage.
    for (let attempt = 0; attempt < 5 && !fs.existsSync(importResult) && !fs.existsSync(importResult + '.error.json'); attempt++) {
      await run(currentBinary, path.join(root, 'scripts', 'nwjs', 'import-app'), destination, {
        DUCKIETV_IMPORT_BUNDLE: bundle,
        DUCKIETV_IMPORT_OUTPUT: importResult
      })
    }
    if (!fs.existsSync(importResult)) {
      const errorFile = importResult + '.error.json'
      throw new Error(fs.existsSync(errorFile) ? JSON.parse(fs.readFileSync(errorFile, 'utf8')).error : 'Target importer produced no result')
    }
  } finally {
    if (hashTree(source) !== sourceHashBefore) throw new Error('Source profile changed during migration')
  }

  const summary = {
    result: 'PASS',
    sourceHash: sourceHashBefore,
    sourceUnchanged: true,
    sourceCopyHash: copyHash,
    bundleSha256: exported.sha256,
    migrationBundle: bundle,
    destinationProfile: destination,
    recoveryCopy: copy,
    importEvidence: importResult
  }
  const summaryPath = path.join(evidence, 'migration-' + stamp + '.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n', { mode: 384 })
  console.log('PASS lossless NW.js profile migration')
  console.log(path.relative(root, summaryPath))
}

main().catch(function(error) {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
