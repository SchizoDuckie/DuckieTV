describe('show search names', function() {
  var series, episode, dialog, scope, $rootScope, $controller, engines
  var modal = { close: angular.noop }

  beforeEach(module('DuckieTV', function($provide) {
    series = {
      TRAKT_ID: 123,
      TVDB_ID: null,
      name: 'Big Brother Australia',
      alias: null,
      customSearchString: 'HDTV',
      customDelay: null,
      isAnime: function() { return false }
    }
    episode = { TRAKT_ID: 456, getFormattedEpisode: function() { return 'S01E02' } }
    dialog = jasmine.createSpy('create')
    $provide.value('dialogs', { create: dialog })
    $provide.value('FavoritesService', { getByTRAKT_ID: function() { return series } })
    $provide.value('SettingsService', {
      get: function(key) { return key === 'autodownload.period' ? 1 : false },
      isStandalone: function() { return true }
    })
    $provide.value('DuckieTorrent', { getClient: angular.noop })
    $provide.factory('FormlyLoader', function($q) {
      return { load: function() { return $q.when([]) } }
    })
  }))

  beforeEach(inject(function(_$rootScope_, _$controller_, TorrentSearchEngines, $q) {
    $rootScope = _$rootScope_
    $controller = _$controller_
    engines = TorrentSearchEngines
    series.Persist = jasmine.createSpy('Persist').and.callFake(function() { return $q.when() })
  }))

  function openSettings() {
    scope = $rootScope.$new()
    $controller('serieSettingsCtrl', { $scope: scope, $uibModalInstance: modal, data: { serie: series } })
    $rootScope.$digest()
  }

  function episodeQuery() {
    engines.findEpisode(series, episode)
    $rootScope.$digest()
    return dialog.calls.mostRecent().args[2].query
  }

  it('uses a free-text name for episode searches and restores the automatic name when cleared', function() {
    openSettings()
    expect(scope.searchAliases).toEqual([])
    expect(scope.defaultSearchName).toBe('Big Brother Australia')
    scope.model.alias = ' Big Brother AU '
    scope.save()
    $rootScope.$digest()

    expect(series.Persist).toHaveBeenCalled()
    expect(series.name).toBe('Big Brother Australia')
    expect(episodeQuery()).toBe('Big Brother AU S01E02 HDTV')

    openSettings()
    expect(scope.model.alias).toBe('Big Brother AU')
    scope.model.alias = '   '
    scope.save()
    $rootScope.$digest()
    expect(series.alias).toBeNull()
    expect(episodeQuery()).toBe('Big Brother Australia S01E02 HDTV')
  })

  it('keeps an existing alias and search terms when the user cancels', function() {
    series.alias = 'Big Brother AU'
    openSettings()
    scope.model.alias = 'Draft'
    scope.model.customSearchString = 'Other'
    scope.cancel()
    expect(series.Persist).not.toHaveBeenCalled()
    expect(episodeQuery()).toBe('Big Brother AU S01E02 HDTV')
  })
})
