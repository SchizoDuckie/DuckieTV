#!/usr/bin/env node

'use strict'

const path = require('node:path')
const { spawnSync } = require('node:child_process')
const catalog = require('./runtime.json')
const root = path.resolve(__dirname, '..', '..')
const legacyBinary = process.env.NW_LEGACY_BINARY
if (!legacyBinary) {
  throw new Error('NW_LEGACY_BINARY is required so migration verification cannot be skipped')
}

const platform = process.platform === 'darwin' ? 'osx' : process.platform === 'win32' ? 'win' : 'linux'
const artifactRoot = path.join(root, 'dist', 'nwjs-packages', 'DuckieTV-' + catalog.version + '-' + platform + '-' + process.arch)
const artifact = process.platform === 'darwin' ? path.join(artifactRoot, 'DuckieTV.app') : artifactRoot
const npmCli = process.env.npm_execpath
if (!npmCli) {
  throw new Error('Run verify:nw through npm so the portable npm CLI path is available')
}

function command(program, args) {
  const result = spawnSync(program, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error(program + ' ' + args.join(' ') + ' failed')
  }
}

function npm(args) {
  command(process.execPath, [npmCli].concat(args))
}

npm(['test'])
npm(['run', 'locales:check'])
npm(['run', 'scripts:typecheck'])

const suites = ['bootstrap', 'storage', 'features', 'protocols', 'network', 'shell']
suites.forEach(function(suite) {
  npm(['run', 'test:nw', '--', '--suite=' + suite])
})

npm(['run', 'test:nw', '--', '--suite=migration', '--legacy-binary=' + path.resolve(legacyBinary)])
npm(['run', 'nw:package', '--', '--platform=' + platform, '--arch=' + process.arch])
npm(['run', 'test:nw', '--', '--suite=packaged', '--artifact=' + artifact])
console.log('PASS required local NW.js verification suites')
