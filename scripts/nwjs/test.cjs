#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const assets = require('./assets.json')
const catalog = require('./runtime.json')

const root = path.resolve(__dirname, '..', '..')
const outputRoot = path.join(root, 'dist', 'nwjs-tests')
const allowed = new Set(['suite', 'artifact', 'legacy-binary'])
const options = {}
process.argv.slice(2).forEach(function(arg) {
  const match = /^--([^=]+)=(.+)$/.exec(arg)
  if (!match || !allowed.has(match[1])) throw new Error('Unknown argument: ' + arg)
  options[match[1]] = match[2]
})
const suites = ['bootstrap', 'storage', 'migration', 'network', 'shell', 'packaged']
if (!suites.includes(options.suite)) throw new Error('Unknown or missing --suite; expected ' + suites.join(', '))

function targetBinary() {
  if (process.env.NW_TARGET_BINARY) return path.resolve(process.env.NW_TARGET_BINARY)
  const platform = process.platform === 'darwin' ? 'osx' : process.platform === 'win32' ? 'win' : 'linux'
  const base = path.join(root, '_nwjs', 'nwjs-sdk-v' + catalog.version + '-' + platform + '-' + process.arch)
  return process.platform === 'darwin' ? path.join(base, 'nwjs.app', 'Contents', 'MacOS', 'nwjs') : path.join(base, process.platform === 'win32' ? 'nw.exe' : 'nw')
}

function run(binary, app, profile, output, extraArgs, environment, timeoutMs) {
  return new Promise(function(resolve, reject) {
    const child = spawn(binary, ['--user-data-dir=' + profile, '--nwapp=' + app].concat(extraArgs || []), {
      cwd: os.tmpdir(), env: Object.assign({}, process.env, environment || {}, { NW_TEST_OUTPUT: output }), stdio: ['ignore', 'pipe', 'pipe']
    })
    let log = ''
    child.stdout.on('data', function(value) { log += value })
    child.stderr.on('data', function(value) { log += value })
    const timer = setTimeout(function() { child.kill('SIGKILL'); reject(new Error('NW suite timed out\n' + log)) }, timeoutMs || 45000)
    child.on('error', function(error) { clearTimeout(timer); reject(error) })
    child.on('exit', function(code, signal) {
      clearTimeout(timer)
      if (code !== 0 || signal) reject(new Error('NW suite process failed code=' + code + ' signal=' + signal + '\n' + log))
      else resolve()
    })
  })
}

function reset(name) {
  const directory = path.join(outputRoot, name)
  fs.rmSync(directory, { recursive: true, force: true })
  fs.mkdirSync(directory, { recursive: true })
  return directory
}

function assembleFull(directory, hook) {
  assets.directories.forEach(function(name) { fs.cpSync(path.join(root, name), path.join(directory, name), { recursive: true }) })
  assets.files.filter(function(name) { return name !== 'HACKING.md' }).forEach(function(name) { fs.copyFileSync(path.join(root, name), path.join(directory, name)) })
  fs.copyFileSync(hook, path.join(directory, 'nw-test-hook.js'))
  const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'))
  manifest.inject_js_start = 'nw-test-hook.js'
  manifest.window.show = false
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(manifest))
}

async function fullAppSuite(name, hookName) {
  const directory = reset(name)
  const app = path.join(directory, 'app')
  const profile = path.join(directory, 'profile')
  const output = path.join(directory, 'result.json')
  assembleFull(app, path.join(root, 'tests', 'fixtures', 'nwjs', 'full-app', hookName))
  await run(targetBinary(), app, profile, output, name === 'storage' ? ['--duckietv-start-fresh'] : [], {}, 35000)
  const result = JSON.parse(fs.readFileSync(output, 'utf8'))
  if (result.runtime !== catalog.version) throw new Error('Runtime identity mismatch')
  const unexpectedErrors = (result.errors || []).filter(function(error) { return !/no such table: WatchList(?:Object)?/.test(error) })
  if (name === 'bootstrap' && (!result.injector || !result.standalone || result.storageState !== 'native-v1-ready' || unexpectedErrors.length || result.errors.length > 2)) throw new Error('Full application bootstrap failed: ' + JSON.stringify(result))
  if (name === 'storage' && !result.pass) throw new Error('ORM storage contract failed: ' + JSON.stringify(result))
}

async function networkSuite() {
  const directory = reset('network')
  const fixture = path.join(root, 'tests', 'fixtures', 'nwjs', 'network')
  ;['package.json', 'index.html', 'test.js'].forEach(function(name) { fs.copyFileSync(path.join(fixture, name), path.join(directory, name)) })
  fs.copyFileSync(path.join(root, 'js', 'vendor', 'angular.js'), path.join(directory, 'angular.js'))
  fs.copyFileSync(path.join(root, 'js', 'app.authHttpBackend.js'), path.join(directory, 'backend.js'))
  const output = path.join(directory, 'result.json')
  await run(targetBinary(), directory, path.join(directory, 'profile'), output)
  const result = JSON.parse(fs.readFileSync(output, 'utf8'))
  if (result.runtime !== catalog.version || result.results.length !== 9 || result.results.some(function(test) { return !test.pass })) throw new Error('Network contract failed: ' + JSON.stringify(result))
}

async function shellSuite() {
  const probe = spawnSync(process.execPath, [path.join(root, 'scripts', 'nwjs', 'probe.cjs'), '--version=' + catalog.version], { cwd: root, stdio: 'inherit' })
  if (probe.status !== 0) throw new Error('Capability probe failed')
  const platform = process.platform === 'darwin' ? 'osx' : process.platform === 'win32' ? 'win' : 'linux'
  const result = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'nwjs-evidence', 'probe-' + platform + '-' + process.arch + '.json'), 'utf8'))
  if (result.create.capabilities.nativeShell.status !== 'PASS' || result.create.capabilities.background.status !== 'PASS' || result.create.capabilities.queuedClose.status !== 'PASS') throw new Error('Native shell capability or shutdown-drain contract failed')
  const directory = reset('shutdown')
  const profile = path.join(directory, 'profile')
  const app = path.join(directory, 'app')
  const output = path.join(directory, 'result.json')
  assembleFull(app, path.join(root, 'tests', 'fixtures', 'nwjs', 'full-app', 'shutdown-hook.js'))
  await run(targetBinary(), app, profile, output, ['--duckietv-start-fresh'])
  if (!JSON.parse(fs.readFileSync(output, 'utf8')).pass) throw new Error('Ordered foreground shutdown failed')
  fs.rmSync(app, { recursive: true, force: true }); fs.mkdirSync(app, { recursive: true })
  assembleFull(app, path.join(root, 'tests', 'fixtures', 'nwjs', 'full-app', 'shutdown-verify-hook.js'))
  const verifyOutput = path.join(directory, 'verify.json')
  await run(targetBinary(), app, profile, verifyOutput)
  if (!JSON.parse(fs.readFileSync(verifyOutput, 'utf8')).pass) throw new Error('Ordered foreground shutdown lost an accepted write')
}

async function migrationSuite() {
  const legacyBinary = options['legacy-binary'] || process.env.NW_LEGACY_BINARY
  if (!legacyBinary) throw new Error('--legacy-binary or NW_LEGACY_BINARY is required for the migration suite')
  const directory = reset('migration')
  const app = path.join(directory, 'seed-app')
  fs.cpSync(path.join(root, 'tests', 'fixtures', 'nwjs', 'migration-seed'), app, { recursive: true })
  fs.copyFileSync(path.join(root, 'js', 'vendor', 'CRUD.js'), path.join(app, 'CRUD.js'))
  fs.copyFileSync(path.join(root, 'js', 'vendor', 'CRUD.SqliteAdapter.js'), path.join(app, 'CRUD.SqliteAdapter.js'))
  fs.copyFileSync(path.join(root, 'js', 'CRUD.entities.js'), path.join(app, 'CRUD.entities.js'))
  const source = path.join(directory, 'source-profile')
  const seedOutput = path.join(directory, 'seed.json')
  await run(path.resolve(legacyBinary), app, source, seedOutput)
  const seed = JSON.parse(fs.readFileSync(seedOutput, 'utf8'))
  if (!seed.pass || seed.origin !== 'chrome-extension://bagblfnohpiddokbpaacecffdboomafe') throw new Error('Legacy seed identity failed: ' + JSON.stringify(seed))
  const migrationArgs = [path.join(root, 'scripts', 'nwjs', 'migrate.cjs'), '--source-profile=' + source, '--destination-profile=' + path.join(directory, 'destination-profile'), '--legacy-binary=' + path.resolve(legacyBinary)]
  if (process.env.NW_TARGET_BINARY) migrationArgs.push('--target-binary=' + path.resolve(process.env.NW_TARGET_BINARY))
  const migration = spawnSync(process.execPath, migrationArgs, { cwd: root, encoding: 'utf8' })
  if (migration.status !== 0) throw new Error('Migration suite failed\n' + migration.stdout + '\n' + migration.stderr)
  const summaryRelative = migration.stdout.trim().split(/\r?\n/).map(function(line) { return line.replace(/\\/g, '/') }).find(function(line) { return /^dist\/nwjs-evidence\/migration-.*\.json$/.test(line) })
  if (!summaryRelative) throw new Error('Migration summary path was not reported')
  const summary = JSON.parse(fs.readFileSync(path.join(root, summaryRelative), 'utf8'))
  const bundle = JSON.parse(fs.readFileSync(summary.migrationBundle, 'utf8'))
  const repeat = spawnSync(process.execPath, migrationArgs, { cwd: root, encoding: 'utf8' })
  if (repeat.status !== 0) throw new Error('Repeated migration failed\n' + repeat.stdout + '\n' + repeat.stderr)
  const DatabaseSync = require('node:sqlite').DatabaseSync
  const imported = new DatabaseSync(path.join(directory, 'destination-profile', 'Default', 'seriesguide_chrome.sqlite3'), { readOnly: true })
  const exactCounts = ['Series', 'Seasons', 'Episodes', 'Fanart', 'TMDBFanart', 'Jackett'].every(function(table) { return imported.prepare('SELECT COUNT(*) AS count FROM ' + table).get().count === 1 })
  const exactTMDB = imported.prepare('SELECT tmdb_id FROM TMDBFanart WHERE id=102').get()
  imported.close()
  if (!exactCounts || !exactTMDB || exactTMDB.tmdb_id !== 456) throw new Error('Imported native database differs from the six-table legacy fixture')

  async function importerCase(name, candidate, expectedPass, outputOverride) {
    const profile = path.join(directory, name + '-profile')
    const bundlePath = path.join(directory, name + '-bundle.json')
    const output = outputOverride || path.join(directory, name + '-result.json')
    fs.writeFileSync(bundlePath, JSON.stringify(candidate) + '\n')
    for (let attempt = 0; attempt < 5 && !fs.existsSync(output) && !fs.existsSync(output + '.error.json'); attempt++) {
      await run(targetBinary(), path.join(root, 'scripts', 'nwjs', 'import-app'), profile, output, [], { DUCKIETV_IMPORT_BUNDLE: bundlePath, DUCKIETV_IMPORT_OUTPUT: output })
    }
    const passed = fs.existsSync(output) && JSON.parse(fs.readFileSync(output, 'utf8')).result === 'PASS'
    if (passed !== expectedPass) throw new Error('Migration case ' + name + ' had unexpected result')
    if (!expectedPass && !fs.existsSync(output + '.error.json')) throw new Error('Migration case ' + name + ' produced no diagnostic')
    return profile
  }
  const corrupt = JSON.parse(JSON.stringify(bundle)); corrupt.sha256 = '0'.repeat(64)
  await importerCase('corrupt-checksum', corrupt, false)
  const unknownSchema = JSON.parse(JSON.stringify(bundle)); unknownSchema.tables[0].version += 1; delete unknownSchema.sha256
  unknownSchema.sha256 = require('node:crypto').createHash('sha256').update(JSON.stringify(unknownSchema)).digest('hex')
  await importerCase('unknown-schema', unknownSchema, false)
  const interruptedProfile = path.join(directory, 'interrupted-profile')
  fs.mkdirSync(path.join(interruptedProfile, 'Default'), { recursive: true })
  fs.writeFileSync(path.join(interruptedProfile, 'Default', 'migration-journal.json'), JSON.stringify({ version: 1, bundleSha256: bundle.sha256, stage: 'failed' }))
  fs.writeFileSync(path.join(interruptedProfile, 'Default', 'seriesguide_chrome.sqlite3'), 'interrupted')
  const interruptedOutput = path.join(directory, 'interrupted-result.json')
  const validBundlePath = path.join(directory, 'valid-bundle.json'); fs.writeFileSync(validBundlePath, JSON.stringify(bundle) + '\n')
  for (let attempt = 0; attempt < 5 && !fs.existsSync(interruptedOutput) && !fs.existsSync(interruptedOutput + '.error.json'); attempt++) {
    await run(targetBinary(), path.join(root, 'scripts', 'nwjs', 'import-app'), interruptedProfile, interruptedOutput, [], { DUCKIETV_IMPORT_BUNDLE: validBundlePath, DUCKIETV_IMPORT_OUTPUT: interruptedOutput })
  }
  if (!fs.existsSync(interruptedOutput) || JSON.parse(fs.readFileSync(interruptedOutput, 'utf8')).result !== 'PASS') throw new Error('Interrupted migration recovery failed')
  const missingOutput = path.join(directory, 'missing-parent', 'result.json')
  const outputFailureProfile = path.join(directory, 'output-failure-profile')
  for (let attempt = 0; attempt < 5; attempt++) {
    await run(targetBinary(), path.join(root, 'scripts', 'nwjs', 'import-app'), outputFailureProfile, missingOutput, [], { DUCKIETV_IMPORT_BUNDLE: validBundlePath, DUCKIETV_IMPORT_OUTPUT: missingOutput })
  }
  const outputFailureJournal = JSON.parse(fs.readFileSync(path.join(outputFailureProfile, 'Default', 'migration-journal.json'), 'utf8'))
  if (outputFailureJournal.stage !== 'complete') throw new Error('Evidence write failure downgraded an activated migration')
  const verifyApp = path.join(directory, 'verify-app')
  const verifyOutput = path.join(directory, 'verify.json')
  assembleFull(verifyApp, path.join(root, 'tests', 'fixtures', 'nwjs', 'full-app', 'migration-hook.js'))
  await run(targetBinary(), verifyApp, path.join(directory, 'destination-profile'), verifyOutput)
  const verified = JSON.parse(fs.readFileSync(verifyOutput, 'utf8'))
  if (!verified.pass) throw new Error('Migrated app equality failed: ' + JSON.stringify(verified))
}

function packagedSuite() {
  if (!options.artifact) throw new Error('--artifact is required for the packaged suite')
  const helper = path.join(root, 'tests', 'fixtures', 'nwjs', 'packaged-check.cjs')
  const directory = reset('packaged')
  ;['create', 'reopen'].forEach(function(phase) {
    const result = spawnSync(process.execPath, [helper, '--artifact=' + path.resolve(options.artifact), '--work=' + directory, '--phase=' + phase], { cwd: os.tmpdir(), stdio: 'inherit' })
    if (result.status !== 0) throw new Error('Packaged ' + phase + ' failed')
  })
  const platform = process.platform === 'darwin' ? 'osx' : process.platform === 'win32' ? 'win' : 'linux'
  const baseArtifact = path.join(root, 'dist', 'nwjs-packages', 'DuckieTV-' + catalog.version + '-' + platform + '-' + process.arch)
  const expectedArtifact = process.platform === 'darwin' ? path.join(baseArtifact, 'DuckieTV.app') : baseArtifact
  if (path.resolve(options.artifact) !== expectedArtifact) throw new Error('Second-build verification requires the standard host artifact path')
  const rebuild = spawnSync(process.execPath, [path.join(root, 'scripts', 'nwjs', 'package.cjs'), '--platform=' + platform, '--arch=' + process.arch], { cwd: root, stdio: 'inherit' })
  if (rebuild.status !== 0) throw new Error('Packaged second build failed')
  const rebuilt = spawnSync(process.execPath, [helper, '--artifact=' + expectedArtifact, '--work=' + directory, '--phase=rebuilt'], { cwd: os.tmpdir(), stdio: 'inherit' })
  if (rebuilt.status !== 0) throw new Error('Packaged rebuilt launch failed')
}

Promise.resolve().then(function() {
  if (options.suite === 'bootstrap') return fullAppSuite('bootstrap', 'bootstrap-hook.js')
  if (options.suite === 'storage') return fullAppSuite('storage', 'storage-hook.js')
  if (options.suite === 'network') return networkSuite()
  if (options.suite === 'shell') return shellSuite()
  if (options.suite === 'migration') return migrationSuite()
  if (options.suite === 'packaged') return packagedSuite()
}).then(function() { console.log('PASS NW.js suite ' + options.suite) }).catch(function(error) { console.error(error.stack || error.message); process.exitCode = 1 })
