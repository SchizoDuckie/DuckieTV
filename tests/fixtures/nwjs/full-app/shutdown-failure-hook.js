'use strict'

function getBackgroundPage() {
  return new Promise(function(resolve, reject) {
    chrome.runtime.getBackgroundPage(function(background) {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
      else resolve(background)
    })
  })
}

window.addEventListener('load', function() {
  window.DuckieTVStorageReady.then(async function() {
    for (var attempt = 0; attempt < 100 && !angular.element(document).injector(); attempt++) await new Promise(function(resolve) { setTimeout(resolve, 25) })
    var background = await getBackgroundPage()
    var shutdownCalls = 0
    background.DuckieTVStorageShutdown = function() { shutdownCalls++; return Promise.reject(new Error('synthetic shutdown failure')) }
    var confirmations = []
    var originalConfirm = window.confirm
    var originalQuit = nw.App.quit
    var quitCalls = 0
    window.confirm = function() { var answer = confirmations.length > 0; confirmations.push(answer); return answer }
    nw.App.quit = function() { quitCalls++ }
    var win = nw.Window.get()
    win.close()
    for (var wait = 0; wait < 100 && confirmations.length < 1; wait++) await new Promise(function(resolve) { setTimeout(resolve, 25) })
    var rejectedAfterFailure = false
    try { await CRUD.executeQuery('SELECT 1') } catch (error) { rejectedAfterFailure = /shutting down/.test(String(error.message || error)) }
    win.close()
    for (var retryWait = 0; retryWait < 100 && quitCalls < 1; retryWait++) await new Promise(function(resolve) { setTimeout(resolve, 25) })
    require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({
      pass: shutdownCalls === 1 && confirmations.join(',') === 'false,true' && quitCalls === 1 && rejectedAfterFailure,
      shutdownCalls: shutdownCalls,
      confirmations: confirmations,
      quitCalls: quitCalls,
      rejectedAfterFailure: rejectedAfterFailure
    }, null, 2))
    window.confirm = originalConfirm
    nw.App.quit = originalQuit
    nw.App.quit()
  }).catch(function(error) {
    require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({ pass: false, error: String(error.stack || error) }))
    nw.App.quit()
  })
})
