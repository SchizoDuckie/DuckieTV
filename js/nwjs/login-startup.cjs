'use strict'

// The renderer uses this module to manage OS login registration. The macOS
// helper performs Service Management calls inside the signed app bundle;
// Windows uses the current user's Run registry value.

const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const registryKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
const registryName = 'DuckieTV'
const agentName = 'tv.duckie.DuckieTV.login'
const startInTray = '--duckietv-start-in-tray'

/**
 * Build the registration interface for the current installation. Tests can
 * supply platform, executable, home, filesystem, and process launcher values.
 */
function createLoginStartup(options) {
  options = options || {}
  const platform = options.platform || process.platform
  const executable = options.executable || process.execPath
  const home = options.home || os.homedir()
  const fileSystem = options.fs || fs
  const run = options.spawnSync || spawnSync

  function applicationPath() {
    if (platform === 'darwin') {
      // process.execPath may point to an NW.js Renderer helper several bundles
      // below DuckieTV.app, so climb until the app containing app.nw is found.
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
    // Older builds wrote this file directly. It is removed after migration to
    // the bundled Service Management agent to avoid a second login launch.
    return path.join(home, 'Library', 'LaunchAgents', agentName + '.plist')
  }

  function macHelper(app) {
    return path.join(app, 'Contents', 'MacOS', 'duckietv-login-helper')
  }

  function macStatus(app) {
    // Keep Service Management inside the signed native helper. Node itself has
    // no binding for SMAppService, and reading a plist would miss user approval.
    const result = run(macHelper(app), ['status'], { encoding: 'utf8' })
    if (result.error || result.status !== 0) {
      throw result.error || new Error((result.stderr || 'Could not read the macOS login item').trim())
    }
    return result.stdout.trim()
  }

  function runMacHelper(app, action) {
    const result = run(macHelper(app), [action], { encoding: 'utf8' })
    if (result.error || result.status !== 0) {
      throw result.error || new Error((result.stderr || 'Could not update the macOS login item').trim())
    }
    return result.stdout.trim()
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
      const app = applicationPath()
      return app !== null && (platform !== 'darwin' || fileSystem.existsSync(macHelper(app)))
    },
    hasLegacyAgent: function() {
      return platform === 'darwin' && fileSystem.existsSync(agentPath())
    },
    /**
     * Read the current login registration. A legacy macOS agent still counts
     * as enabled until Window settings migrate it to Service Management.
     */
    isEnabled: function() {
      const app = applicationPath()
      if (!app) {
        return false
      }
      if (platform === 'darwin') {
        return macStatus(app) === 'enabled' || fileSystem.existsSync(agentPath())
      }
      return registryValue() === '"' + app + '" ' + startInTray
    },
    /**
     * Update registration for this packaged app. Throws on helper or registry
     * failures and when macOS requires the user to approve the new agent.
     */
    setEnabled: function(enabled) {
      const app = applicationPath()
      if (!app) {
        throw new Error('Login startup requires a packaged DuckieTV application')
      }

      if (platform === 'darwin') {
        // Remove a legacy agent only after the new registration was attempted.
        let result = 'disabled'
        if (enabled) {
          if (macStatus(app) !== 'enabled') {
            result = runMacHelper(app, 'enable')
          }
        } else {
          runMacHelper(app, 'disable')
        }
        fileSystem.rmSync(agentPath(), { force: true })
        if (result === 'requiresApproval') {
          throw new Error('Approve DuckieTV in System Settings > General > Login Items, then reopen Window settings')
        }
        return
      }

      if (enabled) {
        runRegistry(['add', registryKey, '/v', registryName, '/t', 'REG_SZ', '/d', '"' + app + '" ' + startInTray, '/f'])
      } else if (registryValue() !== null) {
        runRegistry(['delete', registryKey, '/v', registryName, '/f'])
      }
    }
  }
}

module.exports = createLoginStartup()
module.exports.createLoginStartup = createLoginStartup
