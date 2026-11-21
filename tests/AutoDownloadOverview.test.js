describe('Auto Download Overview', function() {
  var vm, scope, $q, root, requests, favorites, search, autoDownload, alerts
  var progress, connected, clientName, torrentName, dialog, show

  beforeEach(module('DuckieTV'))
  beforeEach(inject(function($controller, $rootScope, _$q_) {
    $q = _$q_
    root = $rootScope
    scope = root.$new()
    progress = 0
    connected = true
    clientName = 'Transmission'
    torrentName = 'ABC'
    requests = []
    show = { ID_Serie: 7, name: 'Big Brother Australia', alias: 'Big Brother AU' }
    favorites = {
      favorites: [show],
      getEpisodesForDateRange: jasmine.createSpy('range').and.callFake(function() {
        var result = $q.defer()
        requests.push(result)
        return result.promise
      })
    }
    var remote = { getByHash: function(hash) {
      if (hash === 'ABC') return {
        hash: hash,
        getName: function() { return torrentName },
        getProgress: function() { return progress },
        isStarted: function() { return true }
      }
    } }
    var client = {
      getName: function() { return clientName },
      isConnected: function() { return connected },
      getRemote: function() { return remote }
    }
    dialog = $q.defer()
    search = jasmine.createSpy('findEpisode').and.returnValue($q.when({ result: dialog.promise }))
    autoDownload = jasmine.createSpy('autoDownload')
    alerts = jasmine.createSpy('alert')
    vm = $controller('AutoDownloadOverviewCtrl', {
      $scope: scope, FavoritesService: favorites, DuckieTorrent: { getClient: function() { return client } },
      SettingsService: { get: function(key) { return key === 'torrenting.enabled' } },
      AutoDownloadService: { autoDownload: autoDownload }, TorrentSearchEngines: { findEpisode: search },
      InAppAlerts: { show: alerts }
    })
  }))

  afterEach(function() { scope.$destroy() })

  function episode(id, props) {
    return Object.assign(new Episode(), {
      ID_Serie: 7, ID_Episode: id, TRAKT_ID: id + 1000, firstaired: +vm.from, seasonnumber: 1, episodenumber: id
    }, props)
  }

  function complete(episodes, index) {
    requests[index || 0].resolve(episodes)
    root.$digest()
  }

  it('uses inclusive local dates and keeps the latest range when a slower query finishes', function() {
    var today = new Date()
    expect(vm.to).toEqual(new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    var start = new Date(vm.to)
    start.setDate(start.getDate() - 29)
    expect(vm.from).toEqual(start)
    vm.editRange()
    vm.draftFrom = new Date(2024, 2, 1)
    vm.draftTo = new Date(2024, 9, 31)
    expect(vm.applyRange()).toBeTrue()
    expect(favorites.getEpisodesForDateRange.calls.mostRecent().args).toEqual([
      +vm.draftFrom, +new Date(2024, 9, 31, 23, 59, 59, 999), { limit: -1, orderBy: 'firstaired DESC, ID_Episode ASC' }
    ])
    complete([episode(7)], 1)
    complete([episode(9)])
    expect(vm.groups[0].rows[0].id).toBe(7)
    vm.draftTo = new Date(2024, 1, 28)
    expect(vm.applyRange()).toBeFalse()
    expect(requests.length).toBe(2)
  })

  it('searches the entire range even beyond the database default and the last displayed page', function() {
    var episodes = Array.from({ length: 2020 }, function(_, i) { return episode(i + 1) })
    episodes[2019].episodename = 'Hidden gem'
    complete(episodes)
    expect(vm.count).toBe(2020)
    expect(vm.groups[0].count).toBe(2020)
    expect(vm.groups[0].rows.length).toBe(100)
    vm.loadMore()
    expect(vm.groups[0].rows.length).toBe(200)
    vm.reload(true)
    expect(vm.loading).toBeFalse()
    complete(episodes, 1)
    expect(vm.groups[0].rows.length).toBe(200)
    vm.filters.groupByDay = false
    vm.filters.query = ' hIDDen Gem '
    vm.filter()
    expect(vm.groups[0].day).toBeNull()
    expect(vm.groups[0].rows.map(function(row) { return row.id })).toEqual([2020])
    expect(vm.hasMore).toBeFalse()
    expect(requests.length).toBe(2)
  })

  it('updates percentage and filtered membership on client and library events without treating an external handoff as complete', function() {
    complete([episode(1, { magnetHash: 'abc' }), episode(2), episode(3, { downloaded: 1 })])
    var tracked = vm.groups[0].rows[0]
    expect(tracked.torrentName).toBe('')
    expect([tracked.status, tracked.progress, vm.activeCount]).toEqual(['downloading', 0, 1])
    vm.filters.hideDownloaded = vm.filters.hideWatched = true
    vm.filter()
    progress = 66
    torrentName = 'Big.Brother.AU.S01E01.1080p'
    root.$broadcast('torrent:update:')
    root.$digest()
    expect(tracked.progress).toBe(66)
    expect(tracked.torrentName).toBe(torrentName)
    root.$broadcast('episode:marked:watched', episode(2, { watched: 1 }))
    progress = 100
    root.$broadcast('torrent:update:')
    root.$digest()
    expect(vm.count).toBe(0)
    connected = false
    root.$digest()
    expect([tracked.status, tracked.progress, vm.count]).toEqual(['offline', null, 1])
    expect(tracked.torrentName).toBe('')
    clientName = 'None'
    connected = true
    root.$digest()
    expect([tracked.status, tracked.progress, vm.count]).toEqual(['untracked', null, 1])
  })

  it('records a confirmed Find selection, leaves dismissal alone and prevents duplicate Auto Download submissions', function() {
    var target = episode(42)
    spyOn(target, 'Persist').and.returnValue($q.when())
    complete([target])
    var row = vm.groups[0].rows[0]
    var action = $q.defer()
    autoDownload.and.returnValue(action.promise)
    vm.autoDownload(row)
    vm.autoDownload(row)
    expect(autoDownload).toHaveBeenCalledOnceWith(show, target, true)
    action.resolve('no-results')
    root.$digest()
    vm.find(row)
    root.$digest()
    dialog.reject('escape key press')
    root.$digest()
    expect(row.busy).toBeFalse()
    expect(target.Persist).not.toHaveBeenCalled()
    expect(alerts).not.toHaveBeenCalled()
    dialog = $q.defer()
    search.and.returnValue($q.when({ result: dialog.promise }))
    vm.find(row)
    root.$digest()
    expect(search).toHaveBeenCalledWith(show, target)
    root.$broadcast('torrent:select', target.TRAKT_ID, 'ABC')
    dialog.resolve('magnet')
    root.$digest()
    expect(target.magnetHash).toBe('ABC')
    expect(target.Persist).toHaveBeenCalledTimes(1)
    expect(row.status).toBe('downloading')
    vm.autoDownload(row)
    expect(autoDownload).toHaveBeenCalledTimes(1)
  })
})
