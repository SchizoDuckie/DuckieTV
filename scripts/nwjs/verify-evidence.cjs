#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const catalog = require('./runtime.json')

const root = path.resolve(__dirname, '..', '..')
const evidence = JSON.parse(fs.readFileSync(path.join(root, 'plans', 'nwjs-evidence.json'), 'utf8'))
const errors = []
const requiredPlatforms = ['macos-arm64', 'macos-x64', 'linux-x64', 'windows-x64']
const requiredFeatures = [
  'startup-and-profile-choice', 'storage-and-orm', 'legacy-profile-migration',
  'library-and-calendar', 'trakt-and-metadata', 'search-and-downloads',
  'networking', 'native-shell', 'notifications', 'settings-and-backup',
  'scheduled-and-background-work', 'torrent-clients', 'release-ui-and-assets'
]
const requiredLocalResults = {
  runtimeIdentity: 'PASS', websql: 'FAIL_EXPECTED_PATH_B', nodeSqlite: 'PASS',
  backgroundTransport: 'PASS', freshBootstrap: 'PASS', networkPreflight: 'PASS',
  unitTests: 'PASS_94', localeDescriptors: 'PASS_25', legacyMigration: 'PASS',
  packagedUpgrade: 'PASS'
}

if (evidence.schemaVersion !== 1) errors.push('unsupported evidence schema')
if (!evidence.target || evidence.target.nw !== catalog.version || evidence.target.chromium !== catalog.components.chromium || evidence.target.node !== catalog.components.node || evidence.target.flavor !== 'sdk') {
  errors.push('target runtime provenance does not match runtime.json')
}

const platforms = Array.isArray(evidence.platforms) ? evidence.platforms : []
const platformIds = platforms.map(function(item) { return item.platform + '-' + item.arch })
requiredPlatforms.forEach(function(id) {
  const item = platforms.find(function(candidate) { return candidate.platform + '-' + candidate.arch === id })
  if (!item) return errors.push('missing platform ' + id)
  if (item.automated !== 'PASS') errors.push(id + ' automated=' + String(item.automated))
  if (item.nativePresentation !== 'PASS') errors.push(id + ' nativePresentation=' + String(item.nativePresentation))
  if (!item.artifact || typeof item.artifact !== 'object') return errors.push(id + ' artifact provenance is missing')
  if (item.artifact.version !== catalog.version || item.artifact.flavor !== 'sdk') errors.push(id + ' artifact runtime provenance is invalid')
  const runtimeTarget = id.replace(/^macos-/, 'osx-').replace(/^windows-/, 'win-')
  if (item.artifact.archiveSha256 !== catalog.checksums.sdk[runtimeTarget]) errors.push(id + ' artifact archive hash is invalid')
  if (!/^[a-f0-9]{64}$/.test(item.artifact.packageSha256 || '')) errors.push(id + ' package hash is invalid')
})
platformIds.filter(function(id, index) { return requiredPlatforms.indexOf(id) === -1 || platformIds.indexOf(id) !== index }).forEach(function(id) {
  errors.push('unexpected or duplicate platform ' + id)
})

Object.keys(requiredLocalResults).forEach(function(id) {
  const actual = evidence.localResults && evidence.localResults[id]
  if (actual !== requiredLocalResults[id]) errors.push(id + '=' + String(actual))
})
if (!evidence.localResults || Object.keys(evidence.localResults).some(function(id) { return !Object.prototype.hasOwnProperty.call(requiredLocalResults, id) })) {
  errors.push('local result IDs do not match the required set')
}

const features = Array.isArray(evidence.features) ? evidence.features : []
requiredFeatures.forEach(function(id) {
  const feature = features.find(function(item) { return item.id === id })
  if (!feature) errors.push('missing feature ' + id)
  else if (feature.status !== 'PASS' || !Array.isArray(feature.evidence) || feature.evidence.length === 0) errors.push(id + ' lacks passing evidence')
})
if (features.some(function(item, index) { return requiredFeatures.indexOf(item.id) === -1 || features.findIndex(function(value) { return value.id === item.id }) !== index })) {
  errors.push('feature IDs do not match the required set')
}

if (evidence.complete !== true) errors.push('complete=false')
if (errors.length) {
  console.error('NW.js release evidence is incomplete:')
  errors.forEach(function(error) { console.error('- ' + error) })
  process.exitCode = 1
} else {
  const digest = crypto.createHash('sha256').update(JSON.stringify(evidence)).digest('hex')
  console.log('PASS complete NW.js release evidence ' + digest)
}
