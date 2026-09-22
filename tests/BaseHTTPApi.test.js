describe('BaseHTTPApi request contract', function() {
  var BaseHTTPApi, http

  beforeEach(module('DuckieTV', function($provide) {
    http = { get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: {} })) }
    $provide.value('$http', http)
  }))

  beforeEach(inject(function(_BaseHTTPApi_) {
    BaseHTTPApi = _BaseHTTPApi_
  }))

  function api() {
    var instance = new BaseHTTPApi()
    instance.config.server = 'http://localhost'
    instance.config.port = 8080
    instance.endpoints = {
      list: '/torrents',
      files: '/torrents/%s/files'
    }
    return instance
  }

  it('requests an endpoint without a path parameter', function() {
    api().request('list')

    expect(http.get).toHaveBeenCalledWith('http://localhost:8080/torrents', { headers: {} })
  })

  it('encodes a scalar path parameter', function() {
    api().request('files', 'hash with spaces')

    expect(http.get).toHaveBeenCalledWith('http://localhost:8080/torrents/hash%20with%20spaces/files', { headers: {} })
  })

  it('passes request options and custom headers through unchanged', function() {
    var options = { cache: true, headers: { Accept: 'text/html', charset: 'utf-8' } }

    api().request('list', undefined, options)

    expect(http.get).toHaveBeenCalledWith('http://localhost:8080/torrents', options)
  })

  it('adds basic auth in the application array format', function() {
    var instance = api()
    instance.config.use_auth = true
    instance.config.username = 'duck'
    instance.config.password = 'secret'

    instance.request('list')

    expect(http.get.calls.mostRecent().args[1].headers.Authorization).toEqual(['duck', 'secret'])
  })

  it('lets an explicit Authorization header override basic auth', function() {
    var instance = api()
    instance.config.use_auth = true
    instance.config.username = 'duck'
    instance.config.password = 'secret'

    instance.request('list', undefined, { headers: { Authorization: 'Bearer token' } })

    expect(http.get.calls.mostRecent().args[1].headers.Authorization).toBe('Bearer token')
  })

  it('preserves client getUrl overrides', function() {
    var instance = api()
    instance.getUrl = jasmine.createSpy('getUrl').and.returnValue('custom://endpoint')

    instance.request('files', 42)

    expect(instance.getUrl).toHaveBeenCalledWith('files', 42)
    expect(http.get.calls.mostRecent().args[0]).toBe('custom://endpoint')
  })
})
