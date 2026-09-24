'use strict'

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const registryKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const registryName = 'DuckieTV'
const agentName = 'tv.duckie.DuckieTV.login'

function escapeXml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function createLoginStartup(options) {
  options = options || {}
  const platform = options.platform || process.platform
  const executable = options.executable || process.execPath
  const home = options.home || os.homedir()
  const fileSystem = options.fs || fs
  const run = options.spawnSync || spawnSync

  function applicationPath() {
    if (platform === 'darwin') {
      let directory = path.dirname(executable)
      while (directory !== path.dirname(directory)) {
        if (directory.endsWith('.app') && fileSystem.existsSync(path.join(directory, 'Contents', 'Resources', 'app.nw'))) {
          return directory
        }
        directory = path.dirname(directory)
      }
      return null
    }
    if (platform === 'win32') {
      return fileSystem.existsSync(path.join(path.dirname(executable), 'app.nw')) ? executable : null
    }
    return null
  }

  function agentPath() {
    return path.join(home, 'Library', 'LaunchAgents', agentName + '.plist')
  }

  function agentContents(app) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n' +
      '<plist version="1.0">\n<dict>\n' +
      '  <key>Label</key><string>' + agentName + '</string>\n' +
      '  <key>ProgramArguments</key>\n  <array>\n' +
      '    <string>/usr/bin/open</string>\n    <string>-a</string>\n' +
      '    <string>' + escapeXml(app) + '</string>\n' +
      '  </array>\n  <key>RunAtLoad</key><true/>\n' +
      '</dict>\n</plist>\n'
  }

  function registryValue() {
    const result = run('reg.exe', ['query', registryKey, '/v', registryName], { encoding: 'utf8', windowsHide: true })
    if (result.error) {
      throw result.error
    }
    if (result.status === 1) {
      return null
    }
    if (result.status !== 0) {
      throw new Error('Could not read the Windows login startup setting')
    }
    const line = result.stdout.split(/\r?\n/).find(function(value) {
      return /^\s*DuckieTV\s+REG_SZ\s+/.test(value)
    })
    return line ? line.replace(/^\s*DuckieTV\s+REG_SZ\s+/, '').trim() : null
  }

  function runRegistry(args) {
    const result = run('reg.exe', args, { encoding: 'utf8', windowsHide: true })
    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      throw new Error('Could not update the Windows login startup setting: ' + (result.stderr || result.stdout).trim())
    }
  }

  return {
    isSupported: function() {
      return applicationPath() !== null
    },
    isEnabled: function() {
      const app = applicationPath()
      if (!app) {
        return false
      }
      if (platform === 'darwin') {
        try {
          return fileSystem.readFileSync(agentPath(), 'utf8') === agentContents(app)
        } catch (error) {
          if (error.code === 'ENOENT') {
            return false
          }
          throw error
        }
      }
      return registryValue() === '"' + app + '"'
    },
    setEnabled: function(enabled) {
      const app = applicationPath()
      if (!app) {
        throw new Error('Login startup requires a packaged DuckieTV application')
      }

      if (platform === 'darwin') {
        const file = agentPath()
        if (!enabled) {
          fileSystem.rmSync(file, { force: true })
          return
        }
        if (this.isEnabled()) {
          return
        }
        fileSystem.mkdirSync(path.dirname(file), { recursive: true })
        const temporary = file + '.' + process.pid + '.tmp'
        try {
          fileSystem.writeFileSync(temporary, agentContents(app), { mode: 0o600 })
          fileSystem.renameSync(temporary, file)
        } finally {
          fileSystem.rmSync(temporary, { force: true })
        }
        return
      }

      if (enabled) {
        runRegistry(['add', registryKey, '/v', registryName, '/t', 'REG_SZ', '/d', '"' + app + '"', '/f'])
      } else if (registryValue() !== null) {
        runRegistry(['delete', registryKey, '/v', registryName, '/f'])
      }
    }
  }
}

module.exports = createLoginStartup()
module.exports.createLoginStartup = createLoginStartup
