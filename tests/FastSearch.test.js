describe('Fast Search', function() {
  var scope, pending
  beforeEach(module('DuckieTV'))
  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new()
    pending = []
    spyOn(CRUD, 'Find').and.callFake(function() {
      return new Promise(function(resolve) { pending.push(resolve) })
    })
    $controller('fastSearchCtrl', {
      $scope: scope,
      $uibModalInstance: {},
      data: { key: '' },
      FavoritesService: { favorites: [] },
      FavoritesManager: {},
      TraktTVv2: { search: function() { return Promise.resolve([]) } },
      SidePanelState: {},
      TorrentSearchEngines: {},
      SettingsService: { get: function() { return false } },
      TorrentDownloadActions: {},
      AutoDownloadService: {}
    })
  }))

  it('treats punctuation as literal search text and only loads one screen of episodes', function() {
    scope.search("It's 100%_fun!")
    expect(CRUD.Find).toHaveBeenCalledOnceWith('Episode',
      [["Episodes.episodename LIKE ? ESCAPE '!'", "%It's 100!%!_fun!!%"]], { limit: 9 })
  })

  it('keeps results from the latest query when an earlier request finishes last', async function() {
    scope.search('first')
    scope.search('second')
    pending[1](['second result'])
    await Promise.resolve()
    expect(scope.searchResults.episodes).toEqual(['second result'])
    pending[0](['first result'])
    await Promise.resolve()
    expect(scope.searchResults.episodes).toEqual(['second result'])
  })

  it('keeps the page empty when a search is cleared during a request', async function() {
    scope.search('old')
    scope.search(' ')
    pending[0](['old result'])
    await Promise.resolve()
    expect(scope.episodesLoading).toBe(false)
    expect(scope.searchResults.episodes).toEqual([])
  })
})
