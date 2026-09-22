#!/usr/bin/env node

'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const https = require('node:https')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { pipeline } = require('node:stream/promises')

const root = path.resolve(__dirname, '..', '..')
const catalog = require('./runtime.json')
const allowedOptions = new Set(['version', 'flavor', 'platform', 'arch'])

process.argv.slice(2).forEach(function(arg) {
  const match = /^--([^=]+)=/.exec(arg)
  if (!match || !allowedOptions.has(match[1])) throw new Error('Unknown argument: ' + arg)
})

function option(name, fallback) {
  const prefix = '--' + name + '='
  const value = process.argv.slice(2).find(function(arg) { return arg.indexOf(prefix) === 0 })
  return value ? value.slice(prefix.length) : fallback
}

function hostPlatform() {
  if (process.platform === 'darwin') return 'osx'
  if (process.platform === 'win32') return 'win'
  if (process.platform === 'linux') return 'linux'
  throw new Error('Unsupported host platform: ' + process.platform)
}

function hostArch() {
  if (process.arch === 'x64' || process.arch === 'arm64' || process.arch === 'ia32') return process.arch
  throw new Error('Unsupported host architecture: ' + process.arch)
}

function request(url, redirects) {
  return new Promise(function(resolve, reject) {
    const downloadRequest = https.get(url, { headers: { 'User-Agent': 'DuckieTV-NW-fetch/1.0' } }, function(response) {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume()
        if (redirects <= 0) return reject(new Error('Too many redirects while fetching ' + url))
        return resolve(request(new URL(response.headers.location, url).toString(), redirects - 1))
      }
      if (response.statusCode !== 200) {
        response.resume()
        return reject(new Error('HTTP ' + response.statusCode + ' while fetching ' + url))
      }
      resolve(response)
    })
    downloadRequest.setTimeout(30000, function() {
      downloadRequest.destroy(new Error('Timed out while fetching ' + url))
    })
    downloadRequest.on('error', reject)
  })
}

async function sha256(file) {
  const hash = crypto.createHash('sha256')
  await pipeline(fs.createReadStream(file), hash)
  return hash.digest('hex')
}

function extract(archive, destination, extension) {
  fs.rmSync(destination, { recursive: true, force: true })
  fs.mkdirSync(path.dirname(destination), { recursive: true })
  const temp = destination + '.extracting-' + process.pid
  fs.rmSync(temp, { recursive: true, force: true })
  fs.mkdirSync(temp, { recursive: true })

  let command
  let args
  if (extension === 'tar.gz') {
    command = 'tar'
    args = ['-xzf', archive, '-C', temp]
  } else if (process.platform === 'win32') {
    command = 'powershell.exe'
    args = ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:NWJS_ARCHIVE -DestinationPath $env:NWJS_DESTINATION -Force']
  } else {
    command = 'unzip'
    args = ['-q', archive, '-d', temp]
  }

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { NWJS_ARCHIVE: archive, NWJS_DESTINATION: temp })
  })
  if (result.status !== 0) {
    fs.rmSync(temp, { recursive: true, force: true })
    throw new Error('Archive extraction failed with status ' + result.status)
  }

  const entries = fs.readdirSync(temp)
  if (entries.length !== 1) throw new Error('Expected one archive root, found: ' + entries.join(', '))
  fs.renameSync(path.join(temp, entries[0]), destination)
  fs.rmSync(temp, { recursive: true, force: true })
}

async function main() {
  const version = option('version', catalog.version)
  const flavor = option('flavor', 'sdk')
  const platform = option('platform', hostPlatform())
  const arch = option('arch', hostArch())
  if (version !== catalog.version) throw new Error('Version is not pinned in runtime.json: ' + version)
  if (flavor !== 'normal' && flavor !== 'sdk') throw new Error('Unknown flavor: ' + flavor)

  const target = platform + '-' + arch
  const platformConfig = catalog.platforms[target]
  const expected = catalog.checksums[flavor][target]
  if (!platformConfig || !expected) throw new Error('No pinned artifact for ' + target + ' (' + flavor + ')')

  const prefix = flavor === 'sdk' ? 'nwjs-sdk' : 'nwjs'
  const filename = prefix + '-v' + version + '-' + target + '.' + platformConfig.archive
  const cache = path.join(root, '_nwjs', 'cache')
  const archive = path.join(cache, filename)
  const destination = path.join(root, '_nwjs', filename.slice(0, -('.' + platformConfig.archive).length))
  fs.mkdirSync(cache, { recursive: true })

  if (!fs.existsSync(archive)) {
    const partial = archive + '.partial'
    fs.rmSync(partial, { force: true })
    console.log('Downloading ' + filename)
    await pipeline(await request('https://dl.nwjs.io/v' + version + '/' + filename, 5), fs.createWriteStream(partial, { flags: 'wx' }))
    fs.renameSync(partial, archive)
  }

  const actual = await sha256(archive)
  if (actual !== expected) throw new Error('SHA-256 mismatch for ' + filename + ': expected ' + expected + ', got ' + actual)
  console.log('Verified SHA-256 ' + actual)

  const marker = path.join(destination, '.duckietv-runtime.json')
  let validExtraction = false
  try {
    const metadata = JSON.parse(fs.readFileSync(marker, 'utf8'))
    validExtraction = metadata.version === version && metadata.flavor === flavor && metadata.target === target && metadata.sha256 === actual
  } catch (error) {
    validExtraction = false
  }

  if (!validExtraction) {
    extract(archive, destination, platformConfig.archive)
    fs.writeFileSync(marker, JSON.stringify({ version: version, flavor: flavor, target: target, sha256: actual }, null, 2) + '\n')
    console.log('Extracted ' + path.relative(root, destination))
  } else {
    console.log('Using existing extraction ' + path.relative(root, destination))
  }
  console.log(destination)
}

main().catch(function(error) {
  console.error(error.stack || error.message)
  process.exitCode = 1
})
