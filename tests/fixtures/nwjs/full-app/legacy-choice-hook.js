'use strict'

var errors = []
window.addEventListener('error', function(event) { errors.push(String(event.error && event.error.stack || event.message)) })
window.addEventListener('unhandledrejection', function(event) { errors.push(String(event.reason && event.reason.stack || event.reason)) })

function pointerClick(button) {
  var rectangle = button.getBoundingClientRect()
  var x = rectangle.left + rectangle.width / 2
  var y = rectangle.top + rectangle.height / 2
  var target = document.elementFromPoint(x, y)
  if (!target || !(target === button || button.contains(target))) return false
  ;['mousedown', 'mouseup', 'click'].forEach(function(type) {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }))
  })
  return true
}

setTimeout(function() {
  var buttons = Array.from(document.querySelectorAll('#storage-startup-error button'))
  var fs = require('node:fs')
  var path = require('node:path')
  var phaseFile = path.join(nw.App.dataPath, 'native-choice-phase')
  if (buttons.length === 2 && localStorage.getItem('duckietv.storage.choice') !== 'fresh') {
    var nativeFrame = nw.App.manifest.window.frame === true && !document.querySelector('.windowChrome')
    if (!fs.existsSync(phaseFile)) {
      var importButton = buttons.find(function(candidate) { return candidate.textContent === 'Import Existing Library' })
      var importHit = nativeFrame && pointerClick(importButton)
      var copyButton = Array.from(document.querySelectorAll('#storage-startup-error button')).find(function(candidate) { return candidate.textContent === 'Copy Destination Path' })
      fs.writeFileSync(phaseFile, importHit && copyButton ? 'import-pass' : 'fail')
      chrome.runtime.reload()
      return
    }
    var freshButton = buttons.find(function(candidate) { return candidate.textContent === 'Start Fresh' })
    var freshHit = nativeFrame && fs.readFileSync(phaseFile, 'utf8') === 'import-pass' && pointerClick(freshButton)
    fs.writeFileSync(path.join(nw.App.dataPath, 'legacy-choice-result'), freshHit ? 'native-pointer-pass' : 'fail')
  }
}, 1000)

setTimeout(function() {
  var fs = require('node:fs')
  var path = require('node:path')
  var injector = window.angular && angular.element(document).injector()
  var pointerResult = null
  try { pointerResult = fs.readFileSync(path.join(nw.App.dataPath, 'legacy-choice-result'), 'utf8') } catch (error) {}
  fs.writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({
    pass: Boolean(injector) && localStorage.getItem('duckietv.storage.state') === 'native-v1-ready' && pointerResult === 'native-pointer-pass',
    pointerResult: pointerResult,
    errors: errors
  }, null, 2))
  nw.App.quit()
}, 10000)
