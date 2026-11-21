describe('BackupCodec', function() {
  var BackupCodec

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function(_BackupCodec_) {
    BackupCodec = _BackupCodec_
  }))

  it('round trips the current version with explicit identities', function() {
    var encoded = BackupCodec.serialize(
      { theme: 'dark', jackett: '[{"name":"local"}]' },
      [{ TRAKT_ID: 42, displaycalendar: 1, autoDownload: 0 }],
      [{ TRAKT_ID: 42, epTRAKT_ID: 84, watchedAt: 1000, downloaded: 1 }]
    )

    var plan = BackupCodec.normalize(angular.toJson(encoded))

    expect(plan.formatVersion).toBe(2)
    expect(plan.settings).toEqual({ theme: 'dark' })
    expect(plan.jackett).toEqual([{ name: 'local' }])
    expect(plan.series).toEqual([{
      identity: { type: 'trakt', id: 42 },
      preferences: { displaycalendar: 1, autoDownload: 0 },
      episodes: [{
        identity: { type: 'trakt', id: 84 },
        watchedAt: 1000,
        downloaded: 1
      }]
    }])
  })

  it('normalizes TVDB-keyed legacy backups', function() {
    var plan = BackupCodec.normalize(fixture('backupLegacyTvdb'))

    expect(plan.sourceFormatVersion).toBe(1)
    expect(plan.series[0].identity).toEqual({ type: 'tvdb', id: '123' })
    expect(plan.series[0].preferences).toEqual({ displaycalendar: 1, alias: 'Legacy Show' })
    expect(plan.series[0].episodes[0].identity).toEqual({ type: 'tvdb', id: 456 })
  })

  it('normalizes Trakt-keyed legacy backups without a preferences sentinel', function() {
    var plan = BackupCodec.normalize({
      settings: { useTrakt_id: true, 'duckietv.storage.state': 'from-another-profile' },
      series: {
        321: [{ TRAKT_ID: 654, watchedAt: null, downloaded: 0 }, { TRAKT_ID: 655, watchedAt: 1000 }]
      }
    })

    expect(plan.settings).toEqual({})
    expect(plan.series[0].identity).toEqual({ type: 'trakt', id: '321' })
    expect(plan.series[0].preferences).toEqual({})
    expect(plan.series[0].episodes[0].identity).toEqual({ type: 'trakt', id: 654 })
    expect(plan.series[0].episodes.map(function(episode) { return episode.downloaded })).toEqual([0, 1])
  })

  it('rejects malformed and unsupported backups before returning a plan', function() {
    expect(function() { BackupCodec.normalize('{') }).toThrowError('Backup is not valid JSON')
    expect(function() { BackupCodec.normalize({ settings: [], series: {} }) }).toThrowError('Backup settings must be an object')
    expect(function() { BackupCodec.normalize({ settings: { jackett: '{}' }, series: {} }) }).toThrowError('Backup Jackett settings must be an array')
    expect(function() { BackupCodec.normalize({ settings: { jackett: '[{}]' }, series: {} }) }).toThrowError('Backup Jackett entry is invalid')
    expect(function() { BackupCodec.normalize({ formatVersion: 99, settings: {}, series: [] }) }).toThrowError('Unsupported backup format version 99')
    expect(function() {
      BackupCodec.normalize({ formatVersion: 2, settings: {}, series: [{ identity: {}, preferences: {}, episodes: [] }] })
    }).toThrowError('Series identity is invalid')
  })
})

describe('BackupCtrl restore', function() {
  var scope, $rootScope, $q, settings, favorites, reader, trakt, dialogs

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function($controller, _$rootScope_, _$q_) {
    $rootScope = _$rootScope_
    $q = _$q_
    scope = $rootScope.$new()
    settings = {
      get: jasmine.createSpy('get').and.callFake(function(key) {
        if (key === 'autobackup.period') return 'never'
        if (key === 'torrenting.enabled') return true
      }),
      restore: jasmine.createSpy('restore'),
      set: jasmine.createSpy('set')
    }
    favorites = {
      flushAdding: jasmine.createSpy('flushAdding'),
      adding: jasmine.createSpy('adding'),
      addFavorite: jasmine.createSpy('addFavorite'),
      added: jasmine.createSpy('added'),
      addError: jasmine.createSpy('addError'),
      favorites: []
    }
    reader = { readAsText: jasmine.createSpy('readAsText') }
    trakt = { resolveID: jasmine.createSpy('resolveID'), serie: jasmine.createSpy('serie') }
    dialogs = { confirm: jasmine.createSpy('confirm') }
    spyOn(Storage.prototype, 'setItem').and.stub()
    spyOn(console, 'error')
    $controller('BackupCtrl', {
      $scope: scope,
      $filter: function() {
        return function(key) {
          return key === 'AUTOBACKUPLIST' ? 'never|daily|weekly|monthly' : key
        }
      },
      BackupService: {},
      dialogs: dialogs,
      FileReader: reader,
      TraktTVv2: trakt,
      SettingsService: settings,
      FavoritesService: favorites,
      CalendarEvents: { clearCache: angular.noop },
      TorrentSearchEngines: {}
    })
  }))

  it('does not wipe or write anything when parsing fails', function() {
    scope.wipeBeforeImport = true
    reader.readAsText.and.returnValue($q.when('{'))

    scope.restore({})
    $rootScope.$digest()

    expect(scope.restoreError).toBe('Backup is not valid JSON')
    expect(scope.restoring).toBeFalse()
    expect(dialogs.confirm).not.toHaveBeenCalled()
    expect(Storage.prototype.setItem).not.toHaveBeenCalled()
    expect(settings.restore).not.toHaveBeenCalled()
    expect(settings.set).not.toHaveBeenCalled()
    expect(favorites.adding).not.toHaveBeenCalled()
    expect(favorites.addFavorite).not.toHaveBeenCalled()
  })

  it('keeps the destination library ready to reopen after a confirmed wipe', function() {
    var storage = Object.create({ removeItem: function(key) { delete this[key] } })
    storage.userPreferences = '{}'
    storage['duckietv.storage.state'] = 'native-v1-ready'
    storage['duckietv.storage.migratedFrom'] = '0.87.0'
    spyOnProperty(window, 'localStorage', 'get').and.returnValue(storage)
    spyOn(CRUD.EntityManager, 'getAdapter').and.returnValue({ db: { execute: function() { return $q.when() } } })
    dialogs.confirm.and.returnValue({ result: $q.when(true) })

    scope.wipeDatabase(true)
    $rootScope.$digest()

    expect(storage.userPreferences).toBeUndefined()
    expect(storage['duckietv.storage.state']).toBe('native-v1-ready')
    expect(storage['duckietv.storage.migratedFrom']).toBe('0.87.0')
  })

  it('completes a settings-only restore after a failed attempt', function() {
    reader.readAsText.and.returnValues($q.reject(new Error('Read failed')), $q.when('{"formatVersion":2,"settings":{},"series":[]}'))

    scope.restore({})
    $rootScope.$digest()
    expect(scope.restoreError).toBe('Read failed')

    scope.restore({})
    $rootScope.$digest()
    expect(scope.restoreError).toBeNull()
    expect(scope.restoring).toBeFalse()
    expect(scope.completed).toBeTrue()
    expect(trakt.resolveID).not.toHaveBeenCalled()
  })

  it('reports the work on the first series before moving on to the next', function() {
    var lookup = $q.defer()
    var details = $q.defer()
    var episodeWrites = $q.defer()
    var preferencesWrite = $q.defer()
    var restored = { trakt_id: 42, title: 'Example Show', name: 'Example Show' }
    var saved = { Persist: function() { return preferencesWrite.promise } }
    reader.readAsText.and.returnValue($q.when({ settings: {}, series: { 10: [{ alias: 'Restored' }], 20: [] } }))
    trakt.resolveID.and.callFake(function(id) {
      return id === '10' ? lookup.promise : $q.reject('Series not found')
    })
    trakt.serie.and.returnValue(details.promise)
    favorites.addFavorite.and.returnValue(episodeWrites.promise)
    spyOn(CRUD, 'FindOne').withArgs('Serie', { TVDB_ID: '10' }).and.returnValue($q.when(saved))

    scope.restore({})
    $rootScope.$digest()

    expect(scope.restoreTotal).toBe(2)
    expect(scope.restoreProcessed).toBe(0)
    expect(scope.restoreActivity.phase).toBe('lookup')
    expect(trakt.resolveID).toHaveBeenCalledOnceWith('10', false)

    lookup.resolve(restored)
    $rootScope.$digest()
    expect(scope.restoreActivity.phase).toBe('details')
    expect(scope.restoreActivity.name).toBe('Example Show')

    var seasonsFetched = trakt.serie.calls.mostRecent().args[3]
    seasonsFetched(1, 3)
    $rootScope.$digest()
    expect(scope.restoreActivity).toEqual(jasmine.objectContaining({ phase: 'fetch', done: 1, total: 3 }))

    details.resolve(restored)
    $rootScope.$digest()
    var episodesSaved = favorites.addFavorite.calls.mostRecent().args[4]
    episodesSaved(5, 9)
    $rootScope.$digest()
    expect(scope.restoreActivity).toEqual(jasmine.objectContaining({ phase: 'save', done: 5, total: 9 }))
    expect(scope.restoreProcessed).toBe(0)

    episodeWrites.resolve(saved)
    $rootScope.$digest()
    expect(scope.restoreActivity.phase).toBe('preferences')
    expect(trakt.resolveID.calls.count()).toBe(1)
    expect(scope.restoring).toBeTrue()
    expect(scope.series[0].state).toBe('adding')
    expect(favorites.adding).toHaveBeenCalledOnceWith(42)
    expect(favorites.added).not.toHaveBeenCalled()

    preferencesWrite.resolve()
    $rootScope.$digest()

    expect(saved.alias).toBe('Restored')
    expect(scope.series[0].state).toBe('added')
    expect(scope.restoreProcessed).toBe(2)
    expect(scope.restoreFailed).toBe(1)
    expect(trakt.resolveID.calls.allArgs()).toEqual([['10', false], ['20', false]])
    expect(scope.restoring).toBeFalse()
    expect(scope.completed).toBeTrue()
  })
})
