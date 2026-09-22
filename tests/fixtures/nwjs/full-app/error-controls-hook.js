'use strict'

window.addEventListener('load', async function() {
  var message = document.getElementById('storage-startup-error')
  for (var attempt = 0; attempt < 100 && message.style.display === 'none'; attempt++) await new Promise(function(resolve) { setTimeout(resolve, 50) })
  var rectangle = message.getBoundingClientRect()
  var target = document.elementFromPoint(rectangle.left + rectangle.width / 2, rectangle.top + rectangle.height / 2)
  require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({
    pass: message.style.display === 'block' && document.body.classList.contains('storage-pending') && nw.App.manifest.window.frame === true && !document.querySelector('.windowChrome') && (target === message || message.contains(target)),
    message: message.textContent,
    hitTarget: target && target.tagName
  }, null, 2))
  nw.Window.get().close()
})
