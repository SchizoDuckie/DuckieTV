'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const WebSocket = require('ws')
const options = {}
process.argv.slice(2).forEach(function(arg) {
  const match = /^--([^=]+)=(.+)$/.exec(arg)
  if (!match) {
    throw new Error('Unknown argument: ' + arg)
  }
  options[match[1]] = match[2]
})

if (!options.artifact || !options.work || !['create', 'reopen', 'rebuilt'].includes(options.phase)) {
  throw new Error('artifact, work and phase are required')
}

const catalog = require(path.resolve(__dirname, '..', '..', '..', 'scripts', 'nwjs', 'runtime.json'))
const root = path.resolve(__dirname, '..', '..', '..')
const revision = spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: root, encoding: 'utf8' })
if (revision.status !== 0) {
  throw new Error('Cannot determine expected build commit')
}
const expectedCommit = revision.stdout.trim()
const expectedVersion = require(path.join(root, 'package.json')).version
const binary = process.platform === 'darwin' ? path.join(options.artifact, 'Contents', 'MacOS', 'nwjs') : path.join(options.artifact, process.platform === 'win32' ? 'nw.exe' : 'nw')
if (process.platform === 'darwin') {
  const resources = path.join(options.artifact, 'Contents', 'Resources')
  const icon = path.join(resources, 'DuckieTV.icns')
  const plist = path.join(options.artifact, 'Contents', 'Info.plist')
  const iconName = spawnSync('plutil', ['-extract', 'CFBundleIconFile', 'raw', '-o', '-', plist], { encoding: 'utf8' })
  if (!fs.existsSync(icon) || fs.readFileSync(icon).subarray(0, 4).toString('ascii') !== 'icns' || iconName.status !== 0 || iconName.stdout.trim() !== 'DuckieTV.icns') {
    throw new Error('Packaged macOS icon metadata is invalid')
  }
}
const profile = path.join(options.work, 'profile')
fs.mkdirSync(profile, { recursive: true })
fs.rmSync(path.join(profile, 'DevToolsActivePort'), { force: true })
const isolatedNetwork = '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1'
// The first run uses the same argument as the login agent. Later runs verify
// that an ordinary launch still takes the normal window startup path.
const child = spawn(binary, ['--user-data-dir=' + profile, '--remote-debugging-port=0', isolatedNetwork].concat(options.phase === 'create' ? ['--duckietv-start-fresh', '--duckietv-start-in-tray'] : []), { cwd: require('node:os').tmpdir(), stdio: 'ignore' })
let socket
const timeout = setTimeout(function() {
  child.kill('SIGKILL')
  process.exit(1)
}, 30000)

function delay(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms)
  })
}
async function main() {
  let port
  for (let index = 0; index < 100; index++) {
    try {
      port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0]
      break
    } catch (error) {
      await delay(100)
    }
  }
  if (!port) {
    throw new Error('Packaged app exposed no debugging port')
  }

  let page
  for (let index = 0; index < 100; index++) {
    const targets = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()
    page = targets.find(function(target) {
      return target.url.endsWith('/tab.html')
    })
    if (page) {
      break
    }
    await delay(100)
  }

  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise(function(resolve, reject) {
    socket.once('open', resolve)
    socket.once('error', reject)
  })

  let counter = 0
  const pending = new Map()
  socket.on('message', function(data) {
    const message = JSON.parse(data)
    if (pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  })

  function rpc(method, params) {
    return new Promise(function(resolve) {
      const id = ++counter
      pending.set(id, resolve)
      socket.send(JSON.stringify({ id: id, method: method, params: params }))
    })
  }

  const mutation = options.phase === 'create' ? "await CRUD.executeQuery('INSERT INTO Series(name,TRAKT_ID) VALUES (?,?)',['Packaged synthetic',912341]);" : ''
  const expression = `(async function() {
    await window.DuckieTVStorageReady
    await new Promise(function(resolve) { setTimeout(resolve, 1000) })
    ${mutation}
    const rows = (await CRUD.executeQuery('SELECT name FROM Series WHERE TRAKT_ID=?', [912341])).rows
    return {
      runtime: process.versions.nw,
      node: process.versions.node,
      chromium: process.versions.chromium,
      version: nw.App.manifest.version,
      buildCommit: nw.App.manifest.build_commit,
      loginStartupSupported: global.DuckieTVRequireFromRoot('js/nwjs/login-startup.cjs').isSupported(),
      startupInTray: angular.element(document).injector().get('StandaloneWindowRuntime').shouldStartInTray(),
      injector: Boolean(angular.element(document).injector()),
      nativeFrame: nw.App.manifest.window.frame === true && !document.querySelector('.windowChrome'),
      rows: rows
    }
  })()`
  const result = await rpc('Runtime.evaluate', { expression: expression, awaitPromise: true, returnByValue: true })
  const value = result.result.result.value
  if (!value.injector || !value.nativeFrame || value.loginStartupSupported !== (process.platform === 'darwin' || process.platform === 'win32') || value.startupInTray !== (options.phase === 'create') || value.runtime !== catalog.version || value.node !== catalog.components.node || value.chromium !== catalog.components.chromium || value.version !== expectedVersion || value.buildCommit !== expectedCommit || value.rows.length !== 1 || value.rows[0].name !== 'Packaged synthetic') {
    throw new Error(JSON.stringify(result))
  }

  fs.writeFileSync(path.join(options.work, options.phase + '.json'), JSON.stringify({ pass: true, phase: options.phase, result: value }, null, 2))
  if (options.phase === 'rebuilt') {
    const closeResult = await rpc('Runtime.evaluate', {
      expression: "localStorage.setItem('standalone.closeSystray', 'Y'); nw.Window.get().close(); true",
      returnByValue: true
    })
    if (closeResult.result.exceptionDetails) {
      throw new Error(JSON.stringify(closeResult))
    }
    await delay(300)
    if (child.exitCode !== null) {
      throw new Error('Close to tray unexpectedly exited the app')
    }
  }
  socket.send(JSON.stringify({ id: ++counter, method: 'Runtime.evaluate', params: { expression: 'nw.App.quit()' } }))
  await new Promise(function(resolve) {
    child.once('exit', resolve)
  })

  clearTimeout(timeout)
  socket.close()
  console.log('PASS packaged ' + options.phase)
}

main().catch(function(error) {
  console.error(error)
  child.kill('SIGKILL')
  if (socket) {
    socket.close()
  }
  clearTimeout(timeout)
  process.exitCode = 1
})
