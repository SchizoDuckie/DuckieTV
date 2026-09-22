describe('shared qBittorrent implementation', function() {
  var qBittorrent41plusAPI, qBittorrent52plusAPI, qBittorrent41plus, qBittorrent52plus, http

  beforeEach(module('DuckieTV', function($provide) {
    http = {
      get: jasmine.createSpy('get'),
      post: jasmine.createSpy('post')
    }
    $provide.value('$http', http)
  }))

  beforeEach(inject(function(_qBittorrent41plusAPI_, _qBittorrent52plusAPI_, _qBittorrent41plus_, _qBittorrent52plus_) {
    qBittorrent41plusAPI = _qBittorrent41plusAPI_
    qBittorrent52plusAPI = _qBittorrent52plusAPI_
    qBittorrent41plus = _qBittorrent41plus_
    qBittorrent52plus = _qBittorrent52plus_
  }))

  function configure(api) {
    api.config.server = 'http://localhost'
    api.config.port = 8080
    api.endpoints = angular.copy(qBittorrent41plus.getAPI().endpoints)
    return api
  }

  it('shares the stable API and remote implementation', function() {
    var sessionAPI = new qBittorrent41plusAPI()
    var keyAPI = new qBittorrent52plusAPI()

    expect(sessionAPI.getTorrents).toBe(keyAPI.getTorrents)
    expect(sessionAPI.addTorrentByUpload).toBe(keyAPI.addTorrentByUpload)
    expect(qBittorrent41plus.getRemote().constructor).toBe(qBittorrent52plus.getRemote().constructor)
  })

  it('keeps endpoint differences in the thin adapters', function() {
    expect(qBittorrent41plus.getAPI().endpoints.login).toBe('/api/v2/auth/login')
    expect(qBittorrent52plus.getAPI().endpoints.login).toBeUndefined()
    expect(qBittorrent41plus.getAPI().endpoints.files).toBe(qBittorrent52plus.getAPI().endpoints.files)
  })

  it('logs in with a session and then reads the API version', function(done) {
    var api = configure(new qBittorrent41plusAPI())
    api.config.username = 'duck'
    api.config.password = 'secret'
    http.post.and.returnValue(Promise.resolve({ data: 'Ok.', status: 200 }))
    http.get.and.returnValue(Promise.resolve({ data: '2.11.0' }))

    api.login().then(function(result) {
      expect(result).toBe(true)
      expect(api.config.apiSubVersion).toBe(11)
      expect(http.post.calls.mostRecent().args[1]).toBe('username=duck&password=secret')
      expect(http.get.calls.mostRecent().args[0]).toContain('/api/v2/app/webapiVersion')
      done()
    }).catch(done.fail)
  })

  it('uses the API key for login and inherited GET requests', function(done) {
    var api = configure(new qBittorrent52plusAPI())
    api.config.apikey = 'key-123'
    http.post.and.returnValue(Promise.resolve({ data: '2.10.4' }))
    http.get.and.returnValue(Promise.resolve({ data: [] }))

    api.login().then(function() {
      return api.getTorrents()
    }).then(function() {
      expect(http.post.calls.first().args[2].headers.Authorization).toBe('Bearer key-123')
      expect(http.get.calls.mostRecent().args[1].headers.Authorization).toBe('Bearer key-123')
      done()
    }).catch(done.fail)
  })

  it('composes file and property requests through the shared request contract', function(done) {
    var api = configure(new qBittorrent52plusAPI())
    api.config.apikey = 'key-123'
    http.get.and.callFake(function(url) {
      if (url.indexOf('/files?') > -1) return Promise.resolve({ data: [{ name: 'episode.mkv' }] })
      return Promise.resolve({ data: { save_path: '/downloads/' } })
    })

    api.getFiles('hash value').then(function(files) {
      expect(files.downloaddir).toBe('/downloads')
      expect(http.get.calls.argsFor(0)[0]).toContain('hash=hash%20value')
      expect(http.get.calls.argsFor(1)[0]).toContain('hash=hash%20value')
      expect(http.get.calls.argsFor(0)[1].headers.Authorization).toBe('Bearer key-123')
      done()
    }).catch(done.fail)
  })

  it('selects the renamed control endpoints from the detected API subversion', function() {
    var api = configure(new qBittorrent52plusAPI())
    api.config.apikey = 'key-123'
    api.config.apiSubVersion = 11
    http.post.and.returnValue(Promise.resolve({ data: '' }))

    api.execute('resume', 'ABC')

    expect(http.post.calls.mostRecent().args[0]).toContain('/api/v2/torrents/start')
    expect(http.post.calls.mostRecent().args[1]).toBe('hashes=ABC')
    expect(http.post.calls.mostRecent().args[2].headers.Authorization).toBe('Bearer key-123')
  })

  it('builds upload fields once and delegates verification', function(done) {
    var api = configure(new qBittorrent41plusAPI())
    var torrent = new Blob(['torrent'])
    http.post.and.returnValue(Promise.resolve({ data: '' }))
    spyOn(api, 'waitForTorrent').and.returnValue(Promise.resolve('ABC'))

    api.addTorrentByUpload(torrent, 'ABC', 'Example', '/downloads', 'TV').then(function(hash) {
      var form = http.post.calls.mostRecent().args[1]
      expect(hash).toBe('ABC')
      expect(form.get('savepath')).toBe('/downloads')
      expect(form.get('category')).toBe('TV')
      expect(api.waitForTorrent).toHaveBeenCalledWith('ABC', 'Example')
      done()
    }).catch(done.fail)
  })
})
