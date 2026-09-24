#!/usr/bin/env node

'use strict'

const fs: typeof import('node:fs') = require('node:fs')
const path: typeof import('node:path') = require('node:path')
const { spawnSync }: typeof import('node:child_process') = require('node:child_process')

type RuntimeCatalog = {
  version: string
  platforms: Record<string, unknown>
  checksums: { sdk: Record<string, string> }
}

type PackageAssets = {
  directories: string[]
  files: string[]
}

type PackageManifest = {
  build_commit?: string
}

const catalog = require('./runtime.json') as RuntimeCatalog
const assets = require('./assets.json') as PackageAssets

const root = path.resolve(__dirname, '..', '..')

function option(name: string): string | undefined {
  const prefix = '--' + name + '='
  const arg = process.argv.slice(2).find(function(value) {
    return value.indexOf(prefix) === 0
  })
  return arg && arg.slice(prefix.length)
}

function main(): void {
  process.argv.slice(2).forEach(function(arg) {
    if (!/^--(platform|arch)=/.test(arg)) {
      throw new Error('Unknown argument: ' + arg)
    }
  })

  const platform = option('platform')
  const arch = option('arch')
  if (!platform || !arch) {
    throw new Error('--platform and --arch are required')
  }

  const target = platform + '-' + arch
  if (!catalog.platforms[target]) {
    throw new Error('Unsupported package target: ' + target)
  }

  const runtimeName = 'nwjs-sdk-v' + catalog.version + '-' + target
  const runtime = path.join(root, '_nwjs', runtimeName)
  const marker = path.join(runtime, '.duckietv-runtime.json')
  if (!fs.existsSync(marker)) {
    throw new Error('Verified SDK extraction is missing; run nw:fetch for ' + target)
  }

  const metadata = JSON.parse(fs.readFileSync(marker, 'utf8'))
  if (metadata.sha256 !== catalog.checksums.sdk[target]) {
    throw new Error('Runtime extraction checksum marker mismatch')
  }

  const revision = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8' })
  const buildCommit = revision.stdout && revision.stdout.trim()
  if (revision.status !== 0 || !buildCommit || !/^[0-9a-f]{40,64}$/.test(buildCommit)) {
    throw new Error('Cannot determine the build commit from Git')
  }

  const output = path.join(root, 'dist', 'nwjs-packages', 'DuckieTV-' + catalog.version + '-' + target)
  const staging = path.join(root, 'dist', 'nwjs-packages', '.staging-' + process.pid)
  fs.rmSync(output, { recursive: true, force: true })
  fs.rmSync(staging, { recursive: true, force: true })
  fs.mkdirSync(staging, { recursive: true })

  assets.directories.forEach(function(directory) {
    fs.cpSync(path.join(root, directory), path.join(staging, directory), { recursive: true })
  })

  assets.files.forEach(function(file) {
    fs.copyFileSync(path.join(root, file), path.join(staging, file))
  })

  const manifestPath = path.join(staging, 'package.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as PackageManifest
  manifest.build_commit = buildCommit
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n')

  if (platform === 'osx') {
    fs.mkdirSync(output, { recursive: true })
    const app = path.join(output, 'DuckieTV.app')
    fs.cpSync(path.join(runtime, 'nwjs.app'), app, { recursive: true, dereference: false, verbatimSymlinks: true })
    const archive = path.join(app, 'Contents', 'Resources', 'app.nw')
    const iconName = 'DuckieTV.icns'
    fs.copyFileSync(path.join(root, 'img', 'logo', 'duckietv.icns'), path.join(app, 'Contents', 'Resources', iconName))
    const zip = spawnSync('zip', ['-q', '-r', archive, '.'], { cwd: staging, stdio: 'inherit' })
    if (zip.status !== 0) {
      throw new Error('Application archive creation failed')
    }

    const plist = path.join(app, 'Contents', 'Info.plist')
    const plistUpdates = [
      ['-replace', 'CFBundleDisplayName', '-string', 'DuckieTV', plist],
      ['-replace', 'CFBundleName', '-string', 'DuckieTV', plist],
      ['-replace', 'CFBundleIconFile', '-string', iconName, plist]
    ]
    plistUpdates.forEach(function(args) {
      const result = spawnSync('plutil', args, { stdio: 'inherit' })
      if (result.status !== 0) {
        throw new Error('Bundle metadata update failed')
      }
    })
  } else {
    fs.cpSync(runtime, output, { recursive: true })
    const archive = path.join(output, 'app.nw')
    const windowsArchive = path.join(output, 'app.zip')
    const command = process.platform === 'win32' ? 'powershell.exe' : 'zip'
    const args = process.platform === 'win32' ?
      ['-NoProfile', '-NonInteractive', '-Command', 'Compress-Archive -Path * -DestinationPath $env:DUCKIETV_APP_ARCHIVE -Force'] :
      ['-q', '-r', archive, '.']
    const result = spawnSync(command, args, {
      cwd: staging,
      stdio: 'inherit',
      env: Object.assign({}, process.env, { DUCKIETV_APP_ARCHIVE: windowsArchive })
    })
    if (result.status !== 0) {
      throw new Error('Application archive creation failed')
    }
    if (process.platform === 'win32') {
      fs.renameSync(windowsArchive, archive)
    }
  }

  fs.rmSync(staging, { recursive: true, force: true })
  console.log(output)
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
}
