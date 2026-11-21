describe('torrent client add responses', function() {
  var $q, $rootScope, post, apis, remote, uTorrent, $timeout

  beforeEach(module('DuckieTV'))
  beforeEach(inject(function(_$q_, _$rootScope_, $http, _$timeout_, Transmission, Deluge, qBittorrent41plus, _uTorrent_) {
    $q = _$q_
    $rootScope = _$rootScope_
    $timeout = _$timeout_
    post = spyOn($http, 'post')
    apis = { transmission: Transmission.getAPI(), deluge: Deluge.getAPI(), qbittorrent: qBittorrent41plus.getAPI() }
    uTorrent = _uTorrent_
    remote = uTorrent.getRemote()
  }))

  function expectRejection(request) {
    var rejected = jasmine.createSpy('rejected')
    request.catch(rejected)
    $rootScope.$digest()
    expect(rejected).toHaveBeenCalled()
  }

  it('rejects a qBittorrent failure body for a magnet and an upload before confirmation', function() {
    post.and.returnValue($q.when({ data: 'Fails.' }))
    spyOn(apis.qbittorrent, 'waitForTorrent')
    expectRejection(apis.qbittorrent.addMagnet('magnet:fixture'))
    expectRejection(apis.qbittorrent.addTorrentByUpload(new Blob(['torrent']), 'ABC', 'Fixture'))
    expect(apis.qbittorrent.waitForTorrent).not.toHaveBeenCalled()
  })

  it('rejects Deluge RPC errors returned with a successful HTTP status', function() {
    post.and.returnValue($q.when({ data: { error: { message: 'Torrent rejected' }, result: null } }))
    expectRejection(apis.deluge.addMagnet('magnet:fixture'))
  })

  it('rejects Transmission HTTP failures and failed RPC results', function() {
    post.and.returnValue($q.reject({ status: 401, headers: angular.noop }))
    expectRejection(apis.transmission.addMagnet('magnet:fixture'))
    post.and.returnValue($q.when({ data: { result: 'invalid or corrupt torrent file' } }))
    expectRejection(apis.transmission.addMagnet('magnet:fixture'))
  })

  it('retries a Transmission session challenge once and accepts a duplicate hash', function() {
    var challenge = { status: 409, headers: function() { return 'new-session' } }
    var response = { result: 'success', arguments: { 'torrent-duplicate': { hashString: 'abc' } } }
    post.and.returnValues($q.reject(challenge), $q.when({ data: response }))
    var accepted = jasmine.createSpy('accepted')
    apis.transmission.addTorrentByUrl('fixture.torrent').then(accepted)
    $rootScope.$digest()
    expect(post.calls.mostRecent().args[2].headers['X-Transmission-Session-Id']).toBe('new-session')
    expect(accepted).toHaveBeenCalledWith('ABC')
  })

  it('rejects a repeated Transmission session challenge', function() {
    var challenge = { status: 409, headers: function() { return 'new-session' } }
    post.and.returnValue($q.reject(challenge))
    expectRejection(apis.transmission.addMagnet('magnet:fixture'))
    expect(post.calls.count()).toBe(2)
  })

  it('settles a uTorrent URL add when the remote list never includes the torrent', function() {
    remote.add = { torrent: function() { return $q.when({}) } }
    remote.torrents = { incomplete: {} }
    var rejected = jasmine.createSpy('rejected')
    uTorrent.addTorrentByUrl('fixture.torrent', 'ABC').catch(rejected)
    $rootScope.$digest()
    $timeout.flush(5000)
    expect(rejected).toHaveBeenCalled()
  })
})
