describe('episode Auto Download outcomes', function() {
  var service, engines, search, client, episode, series, match, settings, alerts, desktop
  var hash = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

  beforeEach(module('DuckieTV', function($provide) {
    settings = { 'notifications.autodownload': true, 'torrenting.min_seeders': 10, 'torrenting.global_size_max': 10000 }
    alerts = jasmine.createSpy('in-app alert')
    desktop = jasmine.createSpy('desktop notification')
    search = { config: { name: 'Example provider' }, search: jasmine.createSpy('search'), getDetails: jasmine.createSpy('details') }
    engines = {
      getDefaultEngine: function() { return search },
      launchMagnet: jasmine.createSpy('launch magnet').and.returnValue(Promise.resolve('accepted'))
    }
    client = { getName: function() { return 'Example client' }, AutoConnect: jasmine.createSpy('connect').and.returnValue(Promise.resolve()) }
    $provide.value('DuckieTorrent', { getClient: function() { return client } })
    $provide.value('SettingsService', { get: function(key) { return settings[key] || '' } })
    $provide.value('SceneNameResolver', { getSearchStringForEpisode: function() { return Promise.resolve('Show S01E01') } })
    $provide.value('FavoritesService', {})
    $provide.value('InAppAlerts', { show: alerts })
    $provide.value('NotificationService', { notify: desktop })
    $provide.value('TorrentSearchEngines', engines)
  }))

  beforeEach(inject(function(AutoDownloadService, $translate) {
    spyOn($translate, 'instant').and.callFake(function(key, context) { return key + ' ' + context.episode })
    service = AutoDownloadService
    series = { name: 'Show', searchProvider: null, customSearchSizeMin: null, customSearchSizeMax: null }
    episode = { TRAKT_ID: 123, getFormattedEpisode: function() { return 'S01E01' }, Persist: jasmine.createSpy('persist').and.returnValue(Promise.resolve()) }
    match = { releasename: 'Show S01E01', magnetUrl: 'magnet:?xt=urn:btih:' + hash, seeders: 20, size: '1 GB' }
    search.search.and.returnValue(Promise.resolve([match]))
  }))

  function expectAlert(type, key) {
    expect(alerts).toHaveBeenCalledWith(type, 'AUTODOWNLOAD/' + key + '/lbl Show S01E01')
  }

  it('waits for acceptance before saving the hash or reporting success', async function() {
    var accept, started
    var submitted = new Promise(function(resolve) { started = resolve })
    engines.launchMagnet.and.callFake(function() {
      started()
      return new Promise(function(resolve) { accept = resolve })
    })
    var action = service.autoDownload(series, episode, true)
    await submitted
    expect(episode.magnetHash).toBeUndefined()
    expect(alerts).not.toHaveBeenCalled()
    accept('accepted')
    expect(await action).toBe('accepted')
    expect(episode.magnetHash).toBe(hash)
    expect(episode.Persist).toHaveBeenCalled()
    expectAlert('success', 'accepted')
    expect(desktop).not.toHaveBeenCalled()
  })

  it('reports rejected submissions without tracking a download', async function() {
    settings['notifications.autodownload'] = false
    engines.launchMagnet.and.callFake(function() { return Promise.reject(new Error('refused')) })
    expect(await service.autoDownload(series, episode, true)).toBe('failed')
    expect(episode.Persist).not.toHaveBeenCalled()
    expect(service.activityList.length).toBe(0)
    expectAlert('error', 'client-error')
    expect(desktop).not.toHaveBeenCalled()
  })

  it('distinguishes a failed provider search from a successful search with zero eligible results', async function() {
    search.search.and.callFake(function() { return Promise.reject(new Error('offline')) })
    await service.autoDownload(series, episode, true)
    expectAlert('error', 'search-error')
    alerts.calls.reset()
    search.search.and.returnValue(Promise.resolve([]))
    expect(await service.autoDownload(series, episode, true)).toBe('no-results')
    expectAlert('info', 'no-results')
    expect(service.activityList[0].status).toBe(4)
    alerts.calls.reset()
    match.seeders = 1
    search.search.and.returnValue(Promise.resolve([match]))
    expect(await service.autoDownload(series, episode, true)).toBe('no-results')
    expectAlert('info', 'no-results')
    expect(service.activityList[1].status).toBe(7)
    expect(client.AutoConnect).not.toHaveBeenCalled()
  })

  it('reports a matching release with unreadable or missing links', async function() {
    delete match.magnetUrl
    match.detailUrl = '/details'
    search.getDetails.and.returnValue(Promise.resolve({}))
    await service.autoDownload(series, episode, true)
    expectAlert('error', 'source-error')
    alerts.calls.reset()
    search.getDetails.and.callFake(function() { return Promise.reject(new Error('unexpected page')) })
    await service.autoDownload(series, episode, true)
    expectAlert('error', 'source-error')
    expect(episode.Persist).not.toHaveBeenCalled()
  })

  it('distinguishes a system handoff from a confirmed client add and a tracking failure', async function() {
    settings['torrenting.launch_via_chromium'] = true
    engines.launchMagnet.and.returnValue(Promise.resolve('handed-off'))
    expect(await service.autoDownload(series, episode, true)).toBe('handed-off')
    expectAlert('success', 'handed-off')
    expect(client.AutoConnect).not.toHaveBeenCalled()
    alerts.calls.reset()
    episode.Persist.and.callFake(function() { return Promise.reject(new Error('write failed')) })
    expect(await service.autoDownload(series, episode, true)).toBe('failed')
    expectAlert('error', 'save-error')
  })

  it('respects manual notification preferences and keeps scheduled results out of the GUI', async function() {
    settings['notifications.autodownload'] = false
    await service.autoDownload(series, episode, true)
    search.search.and.returnValue(Promise.resolve([]))
    await service.autoDownload(series, episode, true)
    expect(alerts).not.toHaveBeenCalled()
    expect(desktop).not.toHaveBeenCalled()
    settings['notifications.autodownload'] = true
    search.search.and.returnValue(Promise.resolve([match]))
    await service.autoDownload(series, episode)
    expect(desktop).toHaveBeenCalled()
    search.search.and.callFake(function() { return Promise.reject(new Error('unavailable')) })
    await service.autoDownload(series, episode)
    expect(alerts).not.toHaveBeenCalled()
  })
})

describe('torrent client submission', function() {
  var engines, client, http, hashes, scope, originalParser, upload, hash
  beforeEach(module('DuckieTV'))
  beforeEach(inject(function($injector) {
    hash = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    upload = new Blob(['torrent bytes'])
    originalParser = window.parseTorrent
    window.parseTorrent = { remote: jasmine.createSpy('parse').and.callFake(function(data, callback) {
      expect(data).toBe(upload)
      callback(null, { infoHash: hash })
    }) }
    client = {
      isConnected: function() { return true },
      getName: function() { return 'Mock Client' },
      Update: angular.noop,
      addMagnet: jasmine.createSpy('magnet'),
      addTorrentByUpload: jasmine.createSpy('upload'),
      addTorrentByUrl: jasmine.createSpy('url').and.returnValue(Promise.resolve(hash))
    }
    http = { get: jasmine.createSpy('get').and.returnValue(Promise.resolve({ data: upload })) }
    hashes = { addToHashList: jasmine.createSpy('record hash') }
    scope = { $broadcast: jasmine.createSpy('broadcast') }
    var registration = DuckieTV._invokeQueue.find(function(entry) { return entry[1] === 'factory' && entry[2][0] === 'TorrentSearchEngines' })
    engines = $injector.invoke(registration[2][1], null, {
      $q: { when: Promise.resolve.bind(Promise) },
      $http: http,
      $rootScope: scope,
      DuckieTorrent: { getClient: function() { return client } },
      SettingsService: { get: function() { return false } },
      TorrentHashListService: hashes,
      SceneNameResolver: {}
    })
  }))
  afterEach(function() { window.parseTorrent = originalParser })

  it('records a hash only after a successful client response, including explicit failure responses', async function() {
    var complete
    client.addMagnet.and.returnValue(new Promise(function(resolve) { complete = resolve }))
    var submitted = engines.launchMagnet('magnet:?xt=urn:btih:' + hash, 1)
    expect(scope.$broadcast).not.toHaveBeenCalled()
    complete(false)
    await expectAsync(submitted).toBeRejected()
    expect(hashes.addToHashList).not.toHaveBeenCalled()
    client.addMagnet.and.returnValue(Promise.resolve(true))
    expect(await engines.launchMagnet('magnet:?xt=urn:btih:' + hash, 1)).toBe('accepted')
    expect(hashes.addToHashList).toHaveBeenCalledWith(hash)
    expect(scope.$broadcast).toHaveBeenCalledWith('torrent:select:1', hash)
  })

  it('downloads and parses a torrent once and forwards destination options when file uploads are unsupported', async function() {
    client.addTorrentByUpload.and.throwError('Upload not implemented')
    var outcome = await engines.launchFromTorrentUrl('/one.torrent', 1, 'Release', '/downloads', 'TV')
    expect(outcome).toEqual({ status: 'accepted', infoHash: hash })
    expect(http.get.calls.count()).toBe(1)
    expect(client.addTorrentByUrl).toHaveBeenCalledWith('/one.torrent', hash, 'Release', '/downloads', 'TV')
    expect(hashes.addToHashList.calls.count()).toBe(1)
  })

  it('distinguishes unreadable source files from a rejected upload and never submits a rejected upload twice', async function() {
    client.addTorrentByUpload.and.callFake(function() { return Promise.reject(new Error('upload failed')) })
    var clientFailure = await engines.launchFromTorrentUrl('/one.torrent', 1, 'Release').catch(function(error) { return error })
    expect(clientFailure.stage).toBe('client')
    expect(client.addTorrentByUrl).not.toHaveBeenCalled()
    expect(hashes.addToHashList).not.toHaveBeenCalled()
    window.parseTorrent.remote.and.callFake(function(data, callback) { callback(new Error('bad file')) })
    var parseFailure = await engines.launchFromTorrentUrl('/two.torrent', 1, 'Release').catch(function(error) { return error })
    expect(parseFailure.stage).toBe('source')
    expect(client.addTorrentByUpload.calls.count()).toBe(1)
  })
})
