'use strict'

var results = []
var fs = require('node:fs')
var server = require('node:http').createServer(function(req, res) {
  var url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/auth' && req.headers.authorization !== 'Basic ' + Buffer.from('probe:synthetic').toString('base64')) {
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="probe"' }); res.end('auth'); return
  }
  if (url.pathname === '/cookie-set') { res.setHeader('Set-Cookie', 'probe=synthetic; Path=/; SameSite=None; Secure'); res.end('set'); return }
  if (url.pathname === '/cookie-get') { res.end(req.headers.cookie || ''); return }
  if (url.pathname === '/redirect') { res.writeHead(302, { Location: '/auth' }); res.end(); return }
  if (url.pathname === '/upload') {
    var chunks = []
    req.on('data', function(chunk) { chunks.push(chunk) })
    req.on('end', function() { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ body: Buffer.concat(chunks).toString(), type: req.headers['content-type'] })) })
    return
  }
  if (url.pathname === '/jsonp') { res.setHeader('Content-Type', 'application/javascript'); res.end(url.searchParams.get('callback') + '({"ok":true})'); return }
  if (url.pathname === '/slow') { setTimeout(function() { res.end('late') }, 1000); return }
  if (url.pathname === '/binary') { res.end(Buffer.from([0, 1, 127, 255])); return }
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
})

server.listen(0, '127.0.0.1', async function() {
  var injector = angular.injector(['ng', 'DuckieTV'])
  var http = injector.get('$http')
  var sce = injector.get('$sce')
  var base = 'http://127.0.0.1:' + server.address().port
  async function test(name, fn) {
    try { results.push({ name: name, pass: true, value: await fn() }) }
    catch (error) { results.push({ name: name, pass: false, error: String(error), status: error.status }) }
  }
  await test('cross-origin GET', async function() { return (await http.get(base + '/json')).status })
  await test('basic XHR credentials', async function() { return (await http.get(base + '/auth', { headers: { Authorization: ['probe', 'synthetic'] } })).status })
  await test('binary XHR', async function() { var bytes = Array.from(new Uint8Array((await http.get(base + '/binary', { responseType: 'arraybuffer' })).data)); if (bytes.join(',') !== '0,1,127,255') throw new Error('bad bytes'); return bytes })
  await test('JSONP envelope', async function() { return (await http.jsonp(sce.trustAsResourceUrl(base + '/jsonp'), { jsonpCallbackParam: 'callback' })).status })
  await test('redirect authentication', async function() { return (await http.get(base + '/redirect', { headers: { Authorization: 'Basic ' + Buffer.from('probe:synthetic').toString('base64') } })).status })
  await test('cookie continuity', async function() { await http.get(base + '/cookie-set', { withCredentials: true }); var value = (await http.get(base + '/cookie-get', { withCredentials: true })).data; if (value.indexOf('probe=synthetic') < 0) throw new Error('cookie missing'); return value })
  await test('multipart bytes', async function() { var data = new FormData(); data.append('label', 'synthetic'); data.append('file', new Blob(['torrent-bytes']), 'probe.torrent'); var value = (await http.post(base + '/upload', data, { transformRequest: angular.identity, headers: { 'Content-Type': undefined } })).data; if (value.type.indexOf('multipart/form-data; boundary=') !== 0 || value.body.indexOf('torrent-bytes') < 0) throw new Error('multipart altered'); return true })
  await test('promise cancellation settles once', async function() { var deferred = injector.get('$q').defer(), count = 0; var request = http.get(base + '/slow', { timeout: deferred.promise }).then(function() { count++; throw new Error('not cancelled') }, function(error) { count++; if (error.status !== -1) throw error }); setTimeout(function() { deferred.resolve() }, 20); await request; await new Promise(function(resolve) { setTimeout(resolve, 50) }); if (count !== 1) throw new Error('duplicate completion'); return count })
  await test('timeout settles', async function() { try { await http.get(base + '/slow', { timeout: 30 }); throw new Error('not cancelled') } catch (error) { if (error.status !== -1) throw error; return error.status } })
  fs.writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify({ runtime: process.versions.nw, results: results }, null, 2))
  server.close(); nw.App.quit()
})
