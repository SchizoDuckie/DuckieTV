console.log('Bootstrapping dynamic background page from nwjs context')

var fs = require('fs')
// eslint-disable-next-line no-unused-vars
var output = ''
var manifest = JSON.parse(fs.readFileSync('manifest.json'))

manifest.background.scripts.map(function(scriptname) {
  console.log('Loading: ', scriptname)
  var s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = scriptname
  document.body.appendChild(s)
})
