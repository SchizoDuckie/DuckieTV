'use strict'

window.addEventListener('load', async function() {
  var message = document.getElementById('storage-startup-error')
  for (var attempt = 0; attempt < 100 && message.style.display === 'none'; attempt++) await new Promise(function(resolve) { setTimeout(resolve, 50) })
  var win = nw.Window.get()
  var actions = []
  var originalMinimize = win.minimize
  var originalMaximize = win.maximize
  var originalRestore = win.restore
  var originalQuit = nw.App.quit
  win.minimize = function() { actions.push('minimize') }
  win.maximize = function() { actions.push('maximize') }
  win.restore = function() { actions.push('restore') }
  nw.App.quit = function() { actions.push('quit') }
  document.getElementById('minimize').click()
  document.getElementById('maximize').click()
  document.getElementById('unmaximize').click()
  document.getElementById('close').click()
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({
    pass: message.style.display === 'block' && document.body.classList.contains('standalone') && actions.join(',') === 'minimize,maximize,restore,quit',
    message: message.textContent,
    actions: actions
  }, null, 2))
  win.minimize = originalMinimize
  win.maximize = originalMaximize
  win.restore = originalRestore
  nw.App.quit = originalQuit
  nw.App.quit()
})
