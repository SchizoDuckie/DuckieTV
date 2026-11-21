describe('episode Auto Download outcomes', function() {
  var service, engines, search, client, episode, series, match, settings, alerts, desktop
  var hash = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

  beforeEach(module('DuckieTV', function($provide) {
    settings = { 'notifications.autodownload': true, 'torrenting.min_seeders': 10, 'torrenting.global_size_max': 10000 }
    alerts = jasmine.createSpy('in-app alert')
    desktop = jasmine.createSpy('desktop notification')
    search = { config: { name: 'Example provider' }, search: jasmine.createSpy('search'), getDetails: jasmine.createSpy('details') }
    engines = {
      getAutoDownloadProviders: jasmine.createSpy('provider order').and.returnValue(['Example provider']),
      getSearchEngine: jasmine.createSpy('get engine').and.returnValue(search),
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

  it('tries selected providers in order, applying filters, and reports only the final outcome', async function() {
    var attempted = []
    engines.getAutoDownloadProviders.and.returnValue(['Empty', 'Few seeds', 'Offline', 'Works', 'Later'])
    engines.getSearchEngine.and.callFake(function(name) {
      return { search: async function() {
        attempted.push(name)
        if (name === 'Empty') return []
        if (name === 'Few seeds') return [Object.assign({}, match, { seeders: 1 })]
        if (name === 'Offline') throw new Error('unavailable')
        return [match]
      } }
    })
    series.searchProvider = 'Empty'
    expect(await service.autoDownload(series, episode, true)).toBe('accepted')
    expect(engines.getAutoDownloadProviders).toHaveBeenCalledWith('Empty')
    expect(attempted).toEqual(['Empty', 'Few seeds', 'Offline', 'Works'])
    expect(engines.launchMagnet).toHaveBeenCalledTimes(1)
    expect(alerts).toHaveBeenCalledTimes(1)
    expectAlert('success', 'accepted')
    expect(service.activityList.map(function(row) { return row.searchProvider })).toEqual([' (Empty)', ' (Few seeds)', ' (Works)'])
  })

  it('continues after unreadable release details but never retries an unconfirmed client submission', async function() {
    engines.getAutoDownloadProviders.and.returnValue(['Broken links', 'Working link', 'Later'])
    engines.getSearchEngine.and.callFake(function(name) {
      if (name !== 'Broken links') return search
      return {
        search: async function() { return [Object.assign({}, match, { magnetUrl: null, detailUrl: '/missing' })] },
        getDetails: async function() { throw new Error('bad details') }
      }
    })
    engines.launchMagnet.and.callFake(async function() { throw new Error('client response lost') })
    expect(await service.autoDownload(series, episode, true)).toBe('failed')
    expect(engines.getSearchEngine.calls.allArgs()).toEqual([['Broken links'], ['Working link']])
    expect(engines.launchMagnet).toHaveBeenCalledTimes(1)
    expect(alerts).toHaveBeenCalledTimes(1)
    expectAlert('error', 'client-error')
  })

  it('reports one outcome after exhausting the list and identifies a partial search failure', async function() {
    engines.getAutoDownloadProviders.and.returnValue(['First', 'Second'])
    search.search.and.returnValue(Promise.resolve([]))
    expect(await service.autoDownload(series, episode, true)).toBe('no-results')
    expect(alerts).toHaveBeenCalledTimes(1)
    expectAlert('info', 'no-results')
    alerts.calls.reset()
    search.search.and.callFake(async function() {
      if (search.search.calls.count() === 3) throw new Error('offline')
      return []
    })
    expect(await service.autoDownload(series, episode, true)).toBe('failed')
    expect(alerts).toHaveBeenCalledTimes(1)
    expectAlert('error', 'search-error')
    expect(engines.launchMagnet).not.toHaveBeenCalled()
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

describe('scheduled Auto Download scan', function() {
  var client, favorite, episodes, favorites, settings, service, rootScope
  beforeEach(module('DuckieTV', function($provide) {
    client = { isConnected: function() { return true }, AutoConnect: async function() { return { torrents: {} } } }
    favorite = { ID_Serie: 7, name: 'Show', TVDB_ID: 101, autoDownload: 1, displaycalendar: 1 }
    var candidate = {
      ID_Serie: 7, watchedAt: null, magnetHash: null, firstaired: null,
      getFormattedEpisode: function() { return 'S01E01' }, isDownloaded: function() { return false }
    }
    episodes = [candidate, Object.assign({}, candidate, { ID_Serie: '7' }), Object.assign({}, candidate, { ID_Serie: 99 })]
    favorites = { favorites: [favorite], getEpisodesForDateRange: jasmine.createSpy('episode range').and.returnValue(Promise.resolve(episodes)) }
    settings = { 'torrenting.autodownload': true, 'autodownload.period': 1, 'autodownload.delay': 15 }
    $provide.value('DuckieTorrent', { getClient: function() { return client } })
    $provide.value('FavoritesService', favorites)
    $provide.value('SettingsService', { get: function(key) { return settings[key] }, set: function(key, value) { settings[key] = value } })
  }))
  beforeEach(inject(function(AutoDownloadService, $rootScope) {
    service = AutoDownloadService
    rootScope = $rootScope
  }))
  afterEach(function() { service.detach() })

  it('uses cached series across a batch of episodes, handling unknown air dates and orphan episodes', async function() {
    spyOn(CRUD, 'FindOne')
    spyOn(service, 'autoDownload')
    await service.autoDownloadCheck()
    expect(service.autoDownload.calls.allArgs()).toEqual([[favorite, episodes[0]], [favorite, episodes[1]]])
    expect(favorites.getEpisodesForDateRange).toHaveBeenCalledTimes(1)
    expect(CRUD.FindOne).not.toHaveBeenCalled()
  })

  it('drops pending scan results when disabled and removes the connection listener on detach', async function() {
    var resolve, started
    var waiting = new Promise(function(signal) { started = signal })
    favorites.getEpisodesForDateRange.and.callFake(function() {
      started()
      return new Promise(function(finish) { resolve = finish })
    })
    spyOn(service, 'autoDownload')
    var pending = service.autoDownloadCheck()
    await waiting
    service.detach()
    resolve(episodes)
    await pending
    expect(service.autoDownload).not.toHaveBeenCalled()

    spyOn(service, 'autoDownloadCheck')
    service.attach()
    service.detach()
    service.attach()
    rootScope.$broadcast('torrentclient:connected')
    expect(service.autoDownloadCheck).toHaveBeenCalledTimes(1)
  })
})

describe('Auto Download provider preferences', function() {
  var engines, settings
  beforeEach(module('DuckieTV', function($provide) {
    settings = {}
    $provide.value('SettingsService', { get: function(key) { return settings[key] } })
  }))
  beforeEach(inject(function(TorrentSearchEngines) {
    engines = TorrentSearchEngines
    var names = ['Default', 'Show override', 'Second']
    names.forEach(function(name) {
      engines.registerSearchEngine(name, { config: {} })
    })
    engines.setDefault('Default')
  }))

  it('keeps an existing single provider or show override and reads legacy multi-engine choices', function() {
    expect(engines.getAutoDownloadProviders()).toEqual(['Default'])
    expect(engines.getAutoDownloadProviders('Show override')).toEqual(['Show override'])
    expect(engines.getAutoDownloadProviders('Removed')).toEqual(['Default'])
    settings['autodownload.multiSE.enabled'] = true
    settings['autodownload.multiSE'] = { 'Default': true, 'Removed': true, 'Second': true, 'Show override': false }
    expect(engines.getAutoDownloadProviders()).toEqual(['Default', 'Second'])
  })

  it('keeps the saved order, prioritizes the show override once and skips disabled providers', function() {
    settings['autodownload.providers'] = ['Second', 'Show override', 'Second', 'Removed', 'Default']
    expect(engines.getAutoDownloadProviders()).toEqual(['Second', 'Show override', 'Default'])
    expect(engines.getAutoDownloadProviders('Show override')).toEqual(['Show override', 'Second', 'Default'])
    settings['autodownload.providers'] = ['Removed']
    expect(engines.getAutoDownloadProviders()).toEqual([])
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
