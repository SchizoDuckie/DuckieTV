'use strict'

globalThis.duckieTVProbeBackground = {
  loaded: true,
  hasDocument: typeof document !== 'undefined',
  argv: process.argv,
  appArgv: nw.App.argv
}

try {
  globalThis.duckieTVProbeBackground.relativeRequire = require('./probe-node.cjs')
} catch (error) {
  globalThis.duckieTVProbeBackground.relativeRequire = String(error.message || error)
}

if (chrome.runtime && chrome.runtime.onConnect) {
  chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(message) {
      port.postMessage({ probe: message.probe, background: true })
    })
  })
}
