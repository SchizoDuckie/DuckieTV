'use strict'

const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { createLoginStartup } = require('../js/nwjs/login-startup.cjs')

test('macOS login startup uses the bundled service and removes its legacy agent', function(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'duckietv-login-'))
  t.after(function() {
    fs.rmSync(home, { recursive: true, force: true })
  })

  const app = path.join(home, 'Duckie & TV.app')
  const executable = path.join(app, 'Contents', 'Frameworks', 'nwjs Framework.framework', 'Versions', '153', 'Helpers', 'nwjs Helper (Renderer).app', 'Contents', 'MacOS', 'nwjs Helper (Renderer)')
  fs.mkdirSync(path.join(app, 'Contents', 'Resources'), { recursive: true })
  fs.writeFileSync(path.join(app, 'Contents', 'Resources', 'app.nw'), '')
  fs.mkdirSync(path.join(app, 'Contents', 'MacOS'), { recursive: true })
  fs.writeFileSync(path.join(app, 'Contents', 'MacOS', 'duckietv-login-helper'), '')
  const actions = []
  let status = 'disabled'
  const startup = createLoginStartup({
    platform: 'darwin', executable: executable, home: home,
    spawnSync: function(command, args) {
      actions.push(args[0])
      if (args[0] === 'enable') {
        status = 'enabled'
      } else if (args[0] === 'disable') {
        status = 'disabled'
      }
      return { status: 0, stdout: status + '\n', stderr: '' }
    }
  })
  const agent = path.join(home, 'Library', 'LaunchAgents', 'tv.duckie.DuckieTV.login.plist')
  const unrelated = path.join(home, 'Library', 'LaunchAgents', 'other.plist')

  assert.equal(startup.isSupported(), true)
  assert.equal(startup.isEnabled(), false)
  fs.mkdirSync(path.dirname(agent), { recursive: true })
  fs.writeFileSync(agent, 'legacy')
  assert.equal(startup.hasLegacyAgent(), true)
  startup.setEnabled(true)
  assert.equal(startup.isEnabled(), true)
  assert.equal(startup.hasLegacyAgent(), false)
  assert.equal(fs.existsSync(agent), false)
  fs.writeFileSync(unrelated, 'unrelated')

  startup.setEnabled(false)
  assert.equal(startup.isEnabled(), false)
  assert.equal(fs.existsSync(agent), false)
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'unrelated')
  assert.deepEqual(actions.filter(function(action) { return action !== 'status' }), ['enable', 'disable'])
})

test('login startup rejects an unpackaged runtime', function() {
  const startup = createLoginStartup({ platform: 'darwin', executable: '/tmp/nwjs.app/Contents/MacOS/nwjs' })
  assert.equal(startup.isSupported(), false)
  assert.throws(function() {
    startup.setEnabled(true)
  }, /packaged DuckieTV/)
})

test('Windows login startup writes and removes the current user Run entry', function() {
  const registry = { value: null }
  const calls = []
  const executable = 'C:\\Program Files\\DuckieTV\\nw.exe'
  const startup = createLoginStartup({
    platform: 'win32',
    executable: executable,
    fs: { existsSync: function(file) { return file.endsWith('app.nw') } },
    spawnSync: function(command, args) {
      calls.push({ command: command, args: args })
      if (args[0] === 'query') {
        return registry.value === null ? { status: 1, stdout: '', stderr: '' } :
          { status: 0, stdout: '\n    DuckieTV    REG_SZ    ' + registry.value + '\n', stderr: '' }
      }
      if (args[0] === 'add') {
        registry.value = args[args.indexOf('/d') + 1]
      } else if (args[0] === 'delete') {
        registry.value = null
      }
      return { status: 0, stdout: '', stderr: '' }
    }
  })

  assert.equal(startup.isEnabled(), false)
  startup.setEnabled(true)
  assert.equal(registry.value, '"' + executable + '" --duckietv-start-in-tray')
  assert.equal(startup.isEnabled(), true)
  startup.setEnabled(false)
  assert.equal(startup.isEnabled(), false)
  assert.ok(calls.some(function(call) { return call.args[0] === 'delete' }))
})
