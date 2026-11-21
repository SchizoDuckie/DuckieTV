'use strict'

function finish(result) { require('node:fs').writeFileSync(process.env.NW_TEST_OUTPUT, JSON.stringify(result, null, 2)); nw.App.quit() }
async function waitForInjector() { for (var attempt = 0; attempt < 100; attempt++) { var injector = angular.element(document).injector(); if (injector) return injector; await new Promise(function(resolve) { setTimeout(resolve, 50) }) } throw new Error('Angular injector did not start') }
window.addEventListener('load', function() {
  window.DuckieTVStorageReady.then(async function() {
    var injector = await waitForInjector()
    var rootScope = injector.get('$rootScope')
    var settings = injector.get('SettingsService')
    var favorites = injector.get('FavoritesService')
    var calendar = injector.get('CalendarEvents')
    var backupService = injector.get('BackupService')
    var backupCodec = injector.get('BackupCodec')
    var runtime = injector.get('StandaloneWindowRuntime')
    var torrent = injector.get('DuckieTorrent')
    var engines = injector.get('TorrentSearchEngines')
    var autoDownload = injector.get('AutoDownloadService')
    var notification = injector.get('NotificationService')
    var aired = Date.now() - 86400000
    await CRUD.executeQuery('INSERT INTO Series (ID_Serie,name,TRAKT_ID,displaycalendar,autoDownload) VALUES (?,?,?,?,?)', [7001, 'Feature Matrix', 97001, 1, 1])
    await CRUD.executeQuery('INSERT INTO Seasons (ID_Season,ID_Serie,seasonnumber,TRAKT_ID) VALUES (?,?,?,?)', [7002, 7001, 1, 97002])
    await CRUD.executeQuery('INSERT INTO Episodes (ID_Episode,ID_Serie,ID_Season,episodenumber,seasonnumber,TRAKT_ID,firstaired,firstaired_iso,watched,downloaded) VALUES (?,?,?,?,?,?,?,?,?,?)', [7003, 7001, 7002, 1, 1, 97003, aired, new Date(aired).toISOString(), 0, 0])
    var serie = (await CRUD.Find('Serie', { TRAKT_ID: 97001 }))[0]
    var episode = (await CRUD.Find('Episode', { TRAKT_ID: 97003 }))[0]
    favorites.favorites.push(serie); favorites.favoriteIDs.push('97001')
    var day = new Date(aired), tomorrow = new Date(aired + 86400000)
    calendar.clearCache(); calendar.setVisibleDays([[day, tomorrow]])
    calendar.processEpisodes(serie, { first: episode }); calendar.processEpisodes(serie, { duplicate: episode })
    if (calendar.getEvents(day).length !== 1) throw new Error('Calendar duplicated an episode')
    await episode.markWatched(true, new Date(1700000000000), rootScope)
    await episode.markDownloaded(rootScope)
    settings.set('feature.matrix.setting', 'exact-value')
    localStorage.setItem('trakttv.token', 'source-backup-token')
    localStorage.setItem('trakttv.refresh_token', 'source-backup-refresh')
    var blob = await backupService.createBackup()
    var backup = JSON.parse(await blob.text())
    var normalized = backupCodec.normalize(backup)
    var backedUp = normalized.series.find(function(item) { return item.identity.id === 97001 })
    if (!backedUp || backedUp.episodes.length !== 1 || backedUp.episodes[0].downloaded !== 1) throw new Error('Native backup omitted feature data')

    await CRUD.executeQuery('DELETE FROM Episodes WHERE TRAKT_ID=?', [97003])
    await CRUD.executeQuery('DELETE FROM Seasons WHERE TRAKT_ID=?', [97002])
    await CRUD.executeQuery('DELETE FROM Series WHERE TRAKT_ID=?', [97001])
    favorites.favorites = favorites.favorites.filter(function(item) { return item.TRAKT_ID !== 97001 })
    favorites.favoriteIDs = favorites.favoriteIDs.filter(function(id) { return id !== '97001' })
    calendar.clearCache()
    calendar.setVisibleDays([[day, tomorrow]])
    var fanart = injector.get('FanartService')
    var originalShowImages = fanart.getShowImages
    var originalSeasonPoster = fanart.getSeasonPoster
    var originalEpisodeImages = fanart.getEpisodeImagesForSeason
    fanart.getShowImages = function() { return Promise.resolve({ fanart: 'fixture-fanart.jpg', poster: 'fixture-poster.jpg' }) }
    fanart.getSeasonPoster = function() { return Promise.resolve('fixture-season.jpg') }
    fanart.getEpisodeImagesForSeason = function() { return Promise.resolve({ 77003: 'fixture-episode.jpg' }) }
    var restoredShow = {
      title: 'Feature Matrix', trakt_id: 97001, tvdb_id: 87001, tmdb_id: 77001,
      tvrage_id: null, imdb_id: 'tt97001', certification: 'TV-14',
      airs: { day: 'Monday', time: '20:00', timezone: 'UTC' }, first_aired: new Date(aired).toISOString(),
      rating: 8, votes: 100, genres: ['Drama'], updated_at: new Date(aired).toISOString(), people: { cast: [] },
      seasons: [{
        number: 1, trakt_id: 97002, tvdb_id: 87002, tmdb_id: 77002, overview: 'Fixture season', rating: 8, votes: 20,
        episodes: [{ number: 1, season: 1, title: 'Pilot', first_aired: new Date(aired).toISOString(), trakt_id: 97003, tvdb_id: 87003, tmdb_id: 77003, imdb_id: 'tt97003', rating: 8, votes: 10 }]
      }]
    }
    localStorage.setItem('trakttv.token', 'destination-token')
    localStorage.setItem('trakttv.refresh_token', 'destination-refresh')
    var restoreScope = rootScope.$new()
    injector.get('$controller')('BackupCtrl', {
      $scope: restoreScope,
      TraktTVv2: {
        resolveID: function() { return Promise.resolve({ trakt_id: 97001, name: 'Feature Matrix' }) },
        serie: function() { return Promise.resolve(restoredShow) }
      }
    })
    restoreScope.restore(new File([JSON.stringify(backup)], 'feature-matrix.backup'))
    for (var restoreAttempt = 0; restoreAttempt < 200 && !restoreScope.completed && !restoreScope.restoreError; restoreAttempt++) await new Promise(function(resolve) { setTimeout(resolve, 25) })
    fanart.getShowImages = originalShowImages
    fanart.getSeasonPoster = originalSeasonPoster
    fanart.getEpisodeImagesForSeason = originalEpisodeImages
    if (restoreScope.restoreError || !restoreScope.completed) throw new Error('Backup controller restore failed: ' + (restoreScope.restoreError || 'timed out'))
    var restoredEpisode = (await CRUD.executeQuery('SELECT watched,downloaded,watchedAt FROM Episodes WHERE TRAKT_ID=?', [97003])).rows[0]
    var restoredSeries = (await CRUD.executeQuery('SELECT name,displaycalendar,autoDownload FROM Series WHERE TRAKT_ID=?', [97001])).rows[0]
    if (!restoredSeries || !restoredEpisode || restoredSeries.name !== 'Feature Matrix' || restoredSeries.displaycalendar !== 1 || restoredSeries.autoDownload !== 1 || restoredEpisode.watched !== 1 || restoredEpisode.downloaded !== 1 || Number(restoredEpisode.watchedAt) !== 1700000000000 || settings.get('feature.matrix.setting') !== 'exact-value' || calendar.getEvents(day).length !== 1 || localStorage.getItem('trakttv.token') !== 'destination-token' || localStorage.getItem('trakttv.refresh_token') !== 'destination-refresh') throw new Error('Backup controller did not restore native state exactly')
    restoreScope.$destroy()

    var backupRunBlock = DuckieTV._runBlocks.find(function(block) { return Array.isArray(block) && block.indexOf('BackupService') !== -1 })
    if (!backupRunBlock) throw new Error('Scheduled backup run block is unavailable')
    var scheduledDelays = []
    var originalSetTimeout = window.setTimeout
    try {
      window.setTimeout = function(callback, delay) { scheduledDelays.push(delay); return scheduledDelays.length }
      localStorage.setItem('autobackup.lastrun', String(Date.now()))
      backupRunBlock[backupRunBlock.length - 1](backupService, { get: function(key) { return key === 'autobackup.period' ? 'daily' : settings.get(key) } }, favorites, { create: function() { throw new Error('Future backup ran immediately') } })
    } finally {
      window.setTimeout = originalSetTimeout
    }
    if (scheduledDelays.length !== 1 || scheduledDelays[0] < 23 * 60 * 60 * 1000 || scheduledDelays[0] > 25 * 60 * 60 * 1000) throw new Error('Scheduled backup timer contract failed')

    runtime.maximize(); if (runtime.getState() !== 'maximized') throw new Error('Window maximize state failed')
    runtime.restore(); if (runtime.getState() !== 'normal') throw new Error('Window restore state failed')
    var zoomBefore = Number(localStorage.getItem('standalone.zoomlevel'))
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 187, ctrlKey: true }))
    var zoomAfter = Number(localStorage.getItem('standalone.zoomlevel'))
    if (zoomAfter !== Math.min(15, zoomBefore + 1)) throw new Error('Zoom shortcut failed')

    var childScope = rootScope.$new(); childScope.path = 'unchanged'
    var input = injector.get('$compile')('<input type="file" nwdirectory downloadpath="path">')(childScope)
    input[0].dispatchEvent(new Event('change'))
    if (childScope.path !== 'unchanged') throw new Error('Directory cancel changed the model')
    childScope.$destroy()

    var originalPermission = chrome.notifications.getPermissionLevel
    var originalCreate = chrome.notifications.create
    var notificationOptions
    chrome.notifications.getPermissionLevel = function(callback) { callback('granted') }
    chrome.notifications.create = function(id, options, callback) { notificationOptions = options; if (callback) callback(id) }
    settings.set('notifications.enabled', true)
    await new Promise(function(resolve) { notification.notify('Feature notice', 'Synthetic message', resolve) })
    chrome.notifications.getPermissionLevel = originalPermission; chrome.notifications.create = originalCreate
    if (!notificationOptions || notificationOptions.iconUrl !== 'img/logo/icon64.png') throw new Error('Notification contract failed')

    var requiredClients = ['Aria2', 'BiglyBT', 'Deluge', 'Ktorrent', 'None', 'Tixati', 'Transmission', 'Vuze', 'qBittorrent 4.1+', 'qBittorrent 5.2+', 'rTorrent', 'tTorrent', 'uTorrent Web UI']
    if (navigator.platform.toLowerCase().indexOf('win') !== -1) requiredClients.push('uTorrent')
    var clientNames = Object.keys(torrent.getClients())
    if (requiredClients.some(function(name) { return clientNames.indexOf(name) === -1 })) throw new Error('Registered torrent client inventory is incomplete: ' + clientNames.join(', '))
    var providerNames = Object.keys(engines.getSearchEngines())
    if (providerNames.length < 5 || providerNames.some(function(name) { return typeof engines.getSearchEngine(name).search !== 'function' })) throw new Error('Search provider inventory is incomplete')
    var incompleteClients = clientNames.filter(function(name) {
      var client = torrent.getClients()[name]
      return !(client && typeof client.connect === 'function' && typeof client.getRemote === 'function')
    })
    if (incompleteClients.length) throw new Error('Registered torrent client connection contract missing: ' + incompleteClients.join(', '))
    var noneClient = torrent.getClients().None
    await noneClient.AutoConnect()
    if (!noneClient.isConnected()) throw new Error('Deterministic torrent client did not connect')
    noneClient.Disconnect()
    if (noneClient.isConnected()) throw new Error('Deterministic torrent client did not disconnect')

    autoDownload.detach()
    autoDownload.attach()
    var scheduledCheck = autoDownload.checkTimeout
    autoDownload.attach()
    if (!scheduledCheck || autoDownload.checkTimeout !== scheduledCheck) throw new Error('Auto-download scheduled duplicate background work')
    autoDownload.detach()
    if (autoDownload.checkTimeout !== null) throw new Error('Auto-download scheduler did not detach')

    var showRSSRegistration = DuckieTV._invokeQueue.find(function(entry) { return entry[1] === 'factory' && entry[2][0] === 'ShowRSS' })
    if (!showRSSRegistration) throw new Error('ShowRSS provider registration is unavailable')
    var showRSSAnnotated = showRSSRegistration[2][1]
    var showRSSFactory = showRSSAnnotated[showRSSAnnotated.length - 1]
    var providerRequests = []
    var mockProviderHttp = {
      get: function(url) {
        providerRequests.push(url)
        if (/\/browse$/.test(url)) return Promise.resolve({ data: '<select><option value=""></option><option value="123">Feature Matrix</option></select>' })
        if (/\/browse\/123$/.test(url)) return Promise.resolve({ data: '<a href="http://showrss.test/browse/123">Feature Matrix</a><div class="col-md-10"><ul class="user-timeline"><li><a href="magnet:?xt=urn:btih:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA">Feature Matrix 1×01 1080p</a></li></ul></div>' })
        return Promise.reject(new Error('Unexpected provider URL ' + url))
      }
    }
    var showRSS = showRSSFactory({ get: function(key) { return key === 'mirror.ShowRSS' ? 'http://showrss.test' : null } }, injector.get('$q'), mockProviderHttp)
    var providerResults = await showRSS.search('Feature Matrix S01E01')
    if (providerRequests.length !== 2 || providerResults.length !== 1 || providerResults[0].releasename.indexOf('S01E01') === -1 || providerResults[0].magnetUrl.getInfoHash() !== 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') throw new Error('Provider result normalization failed')

    var selectedClient = torrent.getClient()
    var originalConnected = selectedClient.isConnected
    var originalAddMagnet = selectedClient.addMagnet
    var originalUpdate = selectedClient.Update
    var originalAutoConnect = selectedClient.AutoConnect
    var originalAddTorrentByUpload = selectedClient.addTorrentByUpload
    var originalAddTorrentByUrl = selectedClient.addTorrentByUrl
    var handedOff
    selectedClient.isConnected = function() { return true }
    selectedClient.addMagnet = function(magnet, dlPath, label) { handedOff = { magnet: magnet, dlPath: dlPath, label: label }; return Promise.resolve() }
    selectedClient.Update = function() {}
    settings.set('torrenting.launch_via_chromium', false)
    engines.launchMagnet(providerResults[0].magnetUrl, 97003, '/fixture/downloads', 'Feature Matrix')
    selectedClient.isConnected = originalConnected
    selectedClient.addMagnet = originalAddMagnet
    if (!handedOff || handedOff.dlPath !== '/fixture/downloads' || handedOff.label !== 'Feature Matrix' || injector.get('TorrentHashListService').hasHash('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA') !== true) throw new Error('Provider magnet handoff failed')

    var uploadHandoff
    var urlHandoff
    selectedClient.isConnected = function() { return true }
    selectedClient.addTorrentByUpload = function(data, infoHash, releaseName, dlPath, label) { uploadHandoff = { data: data, infoHash: infoHash, releaseName: releaseName, dlPath: dlPath, label: label }; return Promise.resolve() }
    selectedClient.addTorrentByUrl = function(url, infoHash, releaseName, dlPath, label) { urlHandoff = { url: url, infoHash: infoHash, releaseName: releaseName, dlPath: dlPath, label: label }; return Promise.resolve() }
    var torrentBytes = new Uint8Array([0x64, 0x34, 0x3a, 0x69])
    engines.launchTorrentByUpload(torrentBytes, 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 97003, 'Feature.Matrix.S01E01', '/fixture/upload', 'Upload Label')
    engines.launchTorrentByURL('http://127.0.0.1/fixture.torrent', 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 97003, 'Feature.Matrix.S01E01', '/fixture/url', 'URL Label')
    for (var handoffAttempt = 0; handoffAttempt < 100 && (!uploadHandoff || !urlHandoff); handoffAttempt++) await new Promise(function(resolve) { setTimeout(resolve, 10) })
    if (!uploadHandoff || Array.from(uploadHandoff.data).join(',') !== Array.from(torrentBytes).join(',') || uploadHandoff.infoHash !== 'CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC' || uploadHandoff.releaseName !== 'Feature.Matrix.S01E01' || uploadHandoff.dlPath !== '/fixture/upload' || uploadHandoff.label !== 'Upload Label' || !urlHandoff || urlHandoff.url !== 'http://127.0.0.1/fixture.torrent' || urlHandoff.infoHash !== 'DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' || urlHandoff.releaseName !== 'Feature.Matrix.S01E01' || urlHandoff.dlPath !== '/fixture/url' || urlHandoff.label !== 'URL Label') throw new Error('Torrent upload/URL handoff failed')

    var autoEngine = engines.getDefaultEngine()
    var originalSearch = autoEngine.search
    var autoMagnet = 'magnet:?xt=urn:btih:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    autoEngine.search = function() { return Promise.resolve([{ releasename: 'Feature Matrix S01E01 1080p', magnetUrl: autoMagnet, seeders: 500, leechers: 1, size: '1 GB' }]) }
    selectedClient.AutoConnect = function() { return Promise.resolve({ torrents: {} }) }
    selectedClient.isConnected = function() { return true }
    selectedClient.addMagnet = function(magnet, dlPath, label) { handedOff = { magnet: magnet, dlPath: dlPath, label: label }; return Promise.resolve() }
    var restoredEpisodeEntity = (await CRUD.Find('Episode', { TRAKT_ID: 97003 }))[0]
    var restoredSeriesEntity = (await CRUD.Find('Serie', { TRAKT_ID: 97001 }))[0]
    await autoDownload.autoDownload(restoredSeriesEntity, restoredEpisodeEntity)
    for (var autoAttempt = 0; autoAttempt < 100 && restoredEpisodeEntity.magnetHash !== 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'; autoAttempt++) await new Promise(function(resolve) { setTimeout(resolve, 10) })
    autoEngine.search = originalSearch
    if (!handedOff || restoredEpisodeEntity.magnetHash !== 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB') throw new Error('Automatic download did not persist its magnet')
    await new Promise(function(resolve) { setTimeout(resolve, 1600) })
    selectedClient.isConnected = originalConnected
    selectedClient.addMagnet = originalAddMagnet
    selectedClient.Update = originalUpdate
    selectedClient.AutoConnect = originalAutoConnect
    selectedClient.addTorrentByUpload = originalAddTorrentByUpload
    selectedClient.addTorrentByUrl = originalAddTorrentByUrl

    var traktRegistration = DuckieTV._invokeQueue.find(function(entry) { return entry[1] === 'factory' && entry[2][0] === 'TraktTVv2' })
    if (!traktRegistration) throw new Error('Trakt service registration is unavailable')
    var annotatedFactory = traktRegistration[2][1]
    var traktFactory = annotatedFactory[annotatedFactory.length - 1]
    var traktRequests = []
    var mockHttp = function(options) {
      traktRequests.push(options)
      if (options.url.indexOf('search/show') > -1 && options.url.indexOf('Mock%20Failure') > -1) return Promise.reject({ status: 503, statusText: 'fixture failure' })
      if (options.url.indexOf('search/show') > -1 && options.url.indexOf('Mock%20Cancel') > -1) return Promise.reject({ status: 0, statusText: 'fixture cancellation' })
      if (options.url.indexOf('search/show') > -1) return Promise.resolve({ data: [{ show: { title: 'Mock Metadata Show', ids: { trakt: 12345, tvdb: 54321, imdb: 'tt12345' } } }] })
      if (options.url.indexOf('sync/history') > -1) return Promise.resolve({ data: { added: { episodes: 1 } } })
      return Promise.reject({ status: 404, statusText: 'fixture route missing' })
    }
    mockHttp.get = function() { return Promise.reject({ status: 404 }) }
    mockHttp.post = function(url, body) {
      traktRequests.push({ method: 'POST', url: url, data: body })
      if (url.indexOf('oauth/token') > -1) return Promise.resolve({ data: { access_token: 'fixture-access-token', refresh_token: 'fixture-refresh-token' } })
      return Promise.reject({ status: 404, statusText: 'fixture oauth route missing' })
    }
    var trakt = traktFactory(injector.get('$q'), mockHttp, injector.get('SceneNameResolver'))
    var searchResult = await trakt.search('Mock Metadata Show')
    if (searchResult.length !== 1 || searchResult[0].trakt_id !== 12345 || searchResult[0].tvdb_id !== 54321) throw new Error('Trakt metadata parsing failed')
    await trakt.markEpisodeWatched({ TRAKT_ID: 12345, name: 'Mock Metadata Show' }, { TRAKT_ID: 23456, watchedAt: 1700000000000, getFormattedEpisode: function() { return 'S01E01' } })
    if (traktRequests.length !== 2 || traktRequests[1].method !== 'POST' || traktRequests[1].url.indexOf('sync/history') === -1) throw new Error('Trakt history transport contract failed')
    localStorage.setItem('trakttv.refresh_token', 'fixture-old-refresh')
    var renewedToken = await trakt.renewToken()
    if (renewedToken !== 'fixture-access-token' || localStorage.getItem('trakttv.token') !== 'fixture-access-token' || localStorage.getItem('trakttv.refresh_token') !== 'fixture-refresh-token' || traktRequests[2].url.indexOf('oauth/token') === -1 || JSON.parse(traktRequests[2].data).refresh_token !== 'fixture-old-refresh') throw new Error('Trakt token refresh contract failed')
    var failedSearch = false
    try { await trakt.search('Mock Failure') } catch (error) { failedSearch = String(error).indexOf('Error 503') !== -1 }
    var cancelledSearch = await trakt.search('Mock Cancel')
    if (!failedSearch || cancelledSearch !== undefined) throw new Error('Trakt failure/cancellation contract failed')
    var persisted = await CRUD.executeQuery('SELECT watched,downloaded,watchedAt,magnetHash FROM Episodes WHERE TRAKT_ID=97003')
    finish({ pass: persisted.rows[0].watched === 1 && persisted.rows[0].downloaded === 1 && persisted.rows[0].magnetHash === 'BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', clients: clientNames.sort(), providers: providerNames.sort(), calendarEvents: calendar.getEvents(day).length, backupSeries: normalized.series.length, backupRestored: true, backupProtectedTokens: true, backupScheduled: true, schedulerDeduplicated: true, providerNormalized: true, magnetHandoff: true, torrentUploadAndUrl: true, automaticDownload: true, traktRequests: traktRequests.map(function(request) { return { method: request.method, url: request.url } }), zoomBefore: zoomBefore, zoomAfter: zoomAfter })
  }).catch(function(error) { finish({ pass: false, error: String(error.stack || error) }) })
})
setTimeout(function() { finish({ pass: false, timeout: true }) }, 30000)
