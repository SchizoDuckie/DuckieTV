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
      settings: { useTrakt_id: true },
      series: {
        321: [{ TRAKT_ID: 654, watchedAt: null, downloaded: 0 }]
      }
    })

    expect(plan.series[0].identity).toEqual({ type: 'trakt', id: '321' })
    expect(plan.series[0].preferences).toEqual({})
    expect(plan.series[0].episodes[0].identity).toEqual({ type: 'trakt', id: 654 })
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

describe('BackupCtrl restore validation', function() {
  var $controller, $rootScope, $q, BackupCodec

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function(_$controller_, _$rootScope_, _$q_, _BackupCodec_) {
    $controller = _$controller_
    $rootScope = _$rootScope_
    $q = _$q_
    BackupCodec = _BackupCodec_
  }))

  it('performs no restore writes when parsing fails', function() {
    var scope = $rootScope.$new()
    var settings = {
      get: jasmine.createSpy('get').and.callFake(function(key) {
        if (key === 'autobackup.period') return 'never'
        if (key === 'torrenting.enabled') return true
      }),
      restore: jasmine.createSpy('restore'),
      set: jasmine.createSpy('set')
    }
    var favorites = {
      flushAdding: jasmine.createSpy('flushAdding'),
      isAdded: angular.noop,
      isAdding: angular.noop,
      adding: jasmine.createSpy('adding'),
      addFavorite: jasmine.createSpy('addFavorite'),
      added: jasmine.createSpy('added'),
      addError: jasmine.createSpy('addError'),
      favorites: []
    }
    spyOn(Storage.prototype, 'setItem').and.callThrough()
    spyOn(console, 'error')
    $controller('BackupCtrl', {
      $scope: scope,
      $filter: function() {
        return function(key) {
          return key === 'AUTOBACKUPLIST' ? 'never|daily|weekly|monthly' : key
        }
      },
      BackupService: {},
      BackupCodec: BackupCodec,
      dialogs: {},
      FileReader: { readAsText: function() { return $q.when('{') } },
      TraktTVv2: { resolveID: jasmine.createSpy('resolveID') },
      SettingsService: settings,
      FavoritesService: favorites,
      CalendarEvents: {},
      TorrentSearchEngines: {}
    })
    scope.file = {}

    scope.restore()
    $rootScope.$digest()

    expect(scope.restoreError).toBe('Backup is not valid JSON')
    expect(Storage.prototype.setItem).not.toHaveBeenCalled()
    expect(settings.restore).not.toHaveBeenCalled()
    expect(settings.set).not.toHaveBeenCalled()
    expect(favorites.adding).not.toHaveBeenCalled()
    expect(favorites.addFavorite).not.toHaveBeenCalled()
  })
})
