describe('TorrentDownloadActions', function() {
  var $q, $rootScope, actions, engines, alerts, notifications, provider, result

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function(_$q_, _$rootScope_, $translate, TorrentDownloadActions, TorrentSearchEngines, InAppAlerts, NotificationService, DuckieTorrent) {
    $q = _$q_
    $rootScope = _$rootScope_
    actions = TorrentDownloadActions
    engines = TorrentSearchEngines
    alerts = InAppAlerts
    notifications = NotificationService
    provider = { getDetails: jasmine.createSpy('getDetails') }
    result = { releasename: 'Example Show', detailUrl: 'https://fixture.example/details' }
    spyOn(engines, 'getSearchEngine').and.returnValue(provider)
    spyOn(engines, 'launchMagnet')
    spyOn(engines, 'launchFromTorrentUrl')
    spyOn(engines, 'openExternalLink')
    spyOn(DuckieTorrent, 'getClient').and.returnValue({ getName: function() { return 'Fixture Client' } })
    spyOn($translate, 'instant').and.callFake(function(key) { return key })
    spyOn(alerts, 'show')
    spyOn(notifications, 'notify')
    spyOn(console, 'warn')
  }))

  it('reports a provider error without starting a download', function() {
    provider.getDetails.and.returnValue($q.reject(new Error('Unreadable page')))
    var completed = jasmine.createSpy('completed')
    actions.start(result, 'Fixture', 42).then(completed)
    $rootScope.$digest()

    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'TORRENTDIALOG/details-failed/lbl')
    expect(engines.launchMagnet).not.toHaveBeenCalled()
    expect(notifications.notify).not.toHaveBeenCalled()
    expect(completed).toHaveBeenCalledOnceWith(undefined)
  })

  it('reports an empty details page for an explicit magnet click', function() {
    provider.getDetails.and.returnValue($q.when({}))
    actions.open(result, 'Fixture', 'magnet')
    $rootScope.$digest()

    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'TORRENTDIALOG/no-download-link/lbl')
    expect(engines.openExternalLink).not.toHaveBeenCalled()
  })

  it('waits for client acceptance before announcing the download', function() {
    var magnet = 'magnet:?xt=urn:btih:0123456789012345678901234567890123456789'
    var accepted = $q.defer()
    provider.getDetails.and.returnValue($q.when({ magnetUrl: magnet }))
    engines.launchMagnet.and.returnValue(accepted.promise)
    var completed = jasmine.createSpy('completed')
    actions.start(result, 'Fixture', 42).then(completed)
    $rootScope.$digest()

    expect(notifications.notify).not.toHaveBeenCalled()
    expect(completed).not.toHaveBeenCalled()
    accepted.resolve('accepted')
    $rootScope.$digest()

    expect(result.magnetUrl).toBe(magnet)
    expect(engines.launchMagnet).toHaveBeenCalledOnceWith(magnet, 42, undefined, undefined)
    expect(notifications.notify).toHaveBeenCalledOnceWith('Example Show', 'Download started on Fixture Client')
    expect(completed).toHaveBeenCalledOnceWith(magnet)
  })

  it('reports a declined launch and keeps client acceptance unannounced', function() {
    result.magnetUrl = 'magnet:?xt=urn:btih:0123456789012345678901234567890123456789'
    engines.launchMagnet.and.returnValue($q.reject(new Error('Client unavailable')))
    var completed = jasmine.createSpy('completed')
    actions.start(result, 'Fixture', 42).then(completed)
    $rootScope.$digest()

    expect(provider.getDetails).not.toHaveBeenCalled()
    expect(alerts.show).toHaveBeenCalledOnceWith('error', 'TORRENTDIALOG/launch-failed/lbl')
    expect(notifications.notify).not.toHaveBeenCalled()
    expect(completed).toHaveBeenCalledOnceWith(undefined)
  })

  it('completes an external handoff without a client acceptance notification', function() {
    result.torrentUrl = 'https://fixture.example/show.torrent'
    engines.launchFromTorrentUrl.and.returnValue($q.when({ status: 'handed-off' }))
    var completed = jasmine.createSpy('completed')
    actions.start(result, 'Fixture', 42, '/shows', 'TV').then(completed)
    $rootScope.$digest()

    expect(engines.launchFromTorrentUrl).toHaveBeenCalledOnceWith(result.torrentUrl, 42, 'Example Show', '/shows', 'TV')
    expect(notifications.notify).not.toHaveBeenCalled()
    expect(alerts.show).not.toHaveBeenCalled()
    expect(completed).toHaveBeenCalledOnceWith(result.torrentUrl)
  })
})
