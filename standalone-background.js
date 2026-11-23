console.log('Bootstrapping dynamic background page from nwjs context')

var manifest = global.DuckieTVRequireFromRoot('manifest.json')

// Node 26 exposes an experimental process-global localStorage getter that throws
// without --localstorage-file. Background scripts must keep using Chromium's
// origin-scoped storage, as older NW.js versions did.
if (typeof global !== 'undefined' && global !== window) {
  Object.defineProperty(global, 'localStorage', {
    configurable: true,
    value: window.localStorage
  })
}

function loadScript(scriptname) {
  return new Promise(function(resolve, reject) {
    console.log('Loading: ', scriptname)
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = false
    script.src = chrome.runtime.getURL(scriptname)
    script.onload = resolve
    script.onerror = function() {
      reject(new Error('Failed to load background script ' + scriptname))
    }
    document.body.appendChild(script)
  })
}

// The manifest order keeps the adapter, entities, and storage preflight
// available before the bootstrap creates the shared storage readiness promise.
window.DuckieTVBackgroundScriptsReady = manifest.background.scripts.reduce(function(promise, scriptname) {
  return promise.then(function() { return loadScript(scriptname) })
}, Promise.resolve()).then(function() {
  if (!window.DuckieTVStorageReady) throw new Error('Background storage readiness was not initialized')
}).catch(function(error) {
  window.DuckieTVBackgroundScriptError = error
  console.error(error)
  throw error
})
