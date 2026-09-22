'use strict'

window.addEventListener('load', async function() {
  var message = document.getElementById('storage-startup-error')
  for (var attempt = 0; attempt < 100 && message.style.display === 'none'; attempt++) await new Promise(function(resolve) { setTimeout(resolve, 50) })
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({
    pass: message.style.display === 'block' && nw.App.manifest.window.frame === true && !document.querySelector('.windowChrome')
  }, null, 2))
  nw.Window.get().close()
})
