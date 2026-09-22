#!/usr/bin/env node

'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn } = require('node:child_process')

const root = path.resolve(__dirname, '..', '..')
const catalog = require('./runtime.json')
const fixture = path.join(root, 'tests', 'fixtures', 'nwjs', 'capability-probe')
const allowedOptions = new Set(['version'])

process.argv.slice(2).forEach(function(arg) {
  const match = /^--([^=]+)=/.exec(arg)
  if (!match || !allowedOptions.has(match[1])) throw new Error('Unknown argument: ' + arg)
})

function option(name, fallback) {
  const prefix = '--' + name + '='
  const value = process.argv.slice(2).find(function(arg) { return arg.indexOf(prefix) === 0 })
  return value ? value.slice(prefix.length) : fallback
}

function platformName() {
  if (process.platform === 'darwin') return 'osx'
  if (process.platform === 'win32') return 'win'
  if (process.platform === 'linux') return 'linux'
  throw new Error('Unsupported host platform: ' + process.platform)
}

function runtimeDirectory(version) {
  const override = process.env.NW_TARGET_BINARY
  if (override) return null
  return path.join(root, '_nwjs', 'nwjs-sdk-v' + version + '-' + platformName() + '-' + process.arch)
}

function runtimeBinary(version) {
  if (process.env.NW_TARGET_BINARY) return path.resolve(process.env.NW_TARGET_BINARY)
  const directory = runtimeDirectory(version)
  if (process.platform === 'darwin') return path.join(directory, 'nwjs.app', 'Contents', 'MacOS', 'nwjs')
  if (process.platform === 'win32') return path.join(directory, 'nw.exe')
  return path.join(directory, 'nw')
}

function run(binary, profile, phase, output) {
  return new Promise(function(resolve, reject) {
    const args = ['--user-data-dir=' + profile, '--no-first-run', fixture]
    const child = spawn(binary, args, {
      cwd: os.tmpdir(),
      env: Object.assign({}, process.env, {
        NW_PROBE_OUTPUT: output,
        NW_PROBE_PHASE: phase
      }),
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', function(data) { stdout += data })
    child.stderr.on('data', function(data) { stderr += data })
    const timer = setTimeout(function() {
      child.kill('SIGKILL')
      reject(new Error('NW.js probe timed out in phase ' + phase + '\n' + stdout + '\n' + stderr))
    }, 45000)
    child.on('error', function(error) {
      clearTimeout(timer)
      reject(error)
    })
    child.on('exit', function(code, signal) {
      clearTimeout(timer)
      if (code !== 0 || signal) return reject(new Error('NW.js probe phase ' + phase + ' exited code=' + code + ' signal=' + signal + '\n' + stdout + '\n' + stderr))
      resolve({ stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}

function sanitize(value, profile) {
  return JSON.parse(JSON.stringify(value).split(root).join('<repo>').split(profile).join('<synthetic-profile>'))
}

async function main() {
  const version = option('version', catalog.version)
  if (version !== catalog.version) throw new Error('Version is not pinned in runtime.json: ' + version)
  const binary = runtimeBinary(version)
  if (!fs.existsSync(binary)) throw new Error('NW.js binary not found: ' + binary + '. Run npm run nw:fetch first.')

  const profile = path.join(root, '_nwjs', 'profiles', 'capability-v' + version + '-' + platformName() + '-' + process.arch)
  const outputDirectory = path.join(root, 'dist', 'nwjs-evidence')
  fs.rmSync(profile, { recursive: true, force: true })
  fs.mkdirSync(profile, { recursive: true })
  fs.mkdirSync(outputDirectory, { recursive: true })

  const firstFile = path.join(outputDirectory, 'probe-' + platformName() + '-' + process.arch + '-create.json')
  const reopenFile = path.join(outputDirectory, 'probe-' + platformName() + '-' + process.arch + '-reopen.json')
  fs.rmSync(firstFile, { force: true })
  fs.rmSync(reopenFile, { force: true })
  const createProcess = await run(binary, profile, 'create', firstFile)
  const reopenProcess = await run(binary, profile, 'reopen', reopenFile)
  const create = JSON.parse(fs.readFileSync(firstFile, 'utf8'))
  const reopen = JSON.parse(fs.readFileSync(reopenFile, 'utf8'))

  if (create.runtime.nw !== version || reopen.runtime.nw !== version) {
    throw new Error('Runtime mismatch: expected ' + version + ', got ' + create.runtime.nw + ' and ' + reopen.runtime.nw)
  }
  const websqlPersists = create.capabilities.websql.status === 'PASS' && reopen.capabilities.websql.status === 'PASS'
  const nodeSqlitePersists = create.capabilities.nodeSqlite.status === 'PASS' && reopen.capabilities.nodeSqlite.status === 'PASS'
  if (!websqlPersists && !nodeSqlitePersists) throw new Error('No persistent SQLite backend passed; see ' + path.relative(root, outputDirectory))

  const evidence = sanitize({
    result: 'PASS',
    storageDecision: websqlPersists ? 'websql' : 'node:sqlite',
    target: { version: version, platform: platformName(), arch: process.arch, flavor: 'sdk' },
    host: { platform: process.platform, arch: process.arch, release: os.release() },
    create: create,
    reopen: reopen,
    process: { create: createProcess, reopen: reopenProcess }
  }, profile)
  const combinedFile = path.join(outputDirectory, 'probe-' + platformName() + '-' + process.arch + '.json')
  fs.writeFileSync(combinedFile, JSON.stringify(evidence, null, 2) + '\n')
  console.log('PASS NW.js ' + version + ' capability probe using ' + evidence.storageDecision)
  console.log(path.relative(root, combinedFile))
}

main().catch(function(error) {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
