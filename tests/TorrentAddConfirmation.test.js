describe('Torrent add confirmation', function() {
  var api, $q, $timeout, $rootScope

  beforeEach(module('DuckieTV'))
  beforeEach(inject(function(KtorrentAPI, _$q_, _$timeout_, _$rootScope_) {
    api = new KtorrentAPI()
    $q = _$q_
    $timeout = _$timeout_
    $rootScope = _$rootScope_
    spyOn(api, 'addMagnet').and.returnValue($q.when())
  }))

  function add() {
    var outcome = {}
    api.addTorrentByUrl('example.torrent', 'ABC', 'Example').then(function(hash) {
      outcome.hash = hash
    }, function(error) {
      outcome.error = error
    })
    $rootScope.$digest()
    return outcome
  }

  it('rejects an accepted URL when it never appears in the torrent list', function() {
    spyOn(api, 'getTorrents').and.returnValue($q.when([]))
    var outcome = add()
    for (var attempt = 0; attempt < 5; attempt++) $timeout.flush(1000)
    expect(outcome.error.message).toContain('Hash ABC not found')
    expect(api.getTorrents.calls.count()).toBe(5)
  })

  it('passes a list request failure to the caller', function() {
    var error = new Error('Disconnected')
    spyOn(api, 'getTorrents').and.callFake(function() { return $q.reject(error) })
    var outcome = add()
    $timeout.flush(1000)
    expect(outcome.error).toBe(error)
  })

  it('accepts a torrent that appears on a later poll', function() {
    spyOn(api, 'getTorrents').and.returnValues($q.when([]), $q.when([{ hash: 'abc' }]))
    var outcome = add()
    $timeout.flush(1000)
    $timeout.flush(1000)
    expect(outcome.hash).toBe('ABC')
  })
})
