describe('FavoritesManager add operations', function() {
  var FavoritesManager, FavoritesService, TraktTVv2, $q, $rootScope

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function(_FavoritesManager_, _FavoritesService_, _TraktTVv2_, _$q_, _$rootScope_) {
    FavoritesManager = _FavoritesManager_
    FavoritesService = _FavoritesService_
    TraktTVv2 = _TraktTVv2_
    $q = _$q_
    $rootScope = _$rootScope_
    FavoritesService.flushAdding()
    FavoritesService.favoriteIDs = []
    spyOn(console, 'error')
  }))

  function searchResult() {
    return { trakt_id: 42, title: 'Example Show' }
  }

  function resolvedResult() {
    return { trakt_id: 42, title: 'Example Show', seasons: [] }
  }

  it('moves one record from adding to idle after success', function() {
    spyOn(TraktTVv2, 'serie').and.returnValue($q.when(resolvedResult()))
    spyOn(FavoritesService, 'addFavorite').and.returnValue($q.when({ TRAKT_ID: 42 }))
    var result

    FavoritesManager.add(searchResult()).then(function(value) { result = value })
    expect(FavoritesService.isAdding(42)).toBe(true)
    expect(FavoritesService.isError(42)).toBe(false)
    $rootScope.$digest()

    expect(result).toBe(true)
    expect(FavoritesService.getOperation(42).state).toBe('idle')
  })

  it('shares one promise for concurrent duplicate commands', function() {
    var fetch = $q.defer()
    spyOn(TraktTVv2, 'serie').and.returnValue(fetch.promise)
    spyOn(FavoritesService, 'addFavorite').and.returnValue($q.when({ TRAKT_ID: 42 }))

    var first = FavoritesManager.add(searchResult())
    var second = FavoritesManager.add(searchResult())

    expect(second).toBe(first)
    $rootScope.$digest()
    expect(TraktTVv2.serie.calls.count()).toBe(1)
    fetch.resolve(resolvedResult())
    $rootScope.$digest()
    expect(FavoritesService.isAdding(42)).toBe(false)
  })

  it('records fetch failures and leaves the command retryable', function() {
    var failure = new Error('offline')
    spyOn(TraktTVv2, 'serie').and.returnValue($q.reject(failure))
    spyOn(FavoritesService, 'addFavorite')
    var result

    FavoritesManager.add(searchResult()).then(function(value) { result = value })
    $rootScope.$digest()

    expect(result).toBe(false)
    expect(FavoritesService.isAdding(42)).toBe(false)
    expect(FavoritesService.isError(42)).toBe(true)
    expect(FavoritesService.getOperation(42).error).toBe(failure)
    expect(FavoritesService.addFavorite).not.toHaveBeenCalled()
  })

  it('records persistence failures from the inner add promise', function() {
    var failure = new Error('database failed')
    spyOn(TraktTVv2, 'serie').and.returnValue($q.when(resolvedResult()))
    spyOn(FavoritesService, 'addFavorite').and.returnValue($q.reject(failure))

    FavoritesManager.add(searchResult())
    $rootScope.$digest()

    expect(FavoritesService.isAdding(42)).toBe(false)
    expect(FavoritesService.getOperation(42)).toEqual({ state: 'error', error: failure, promise: null })
  })

  it('clears an earlier error when retrying', function() {
    spyOn(TraktTVv2, 'serie').and.returnValues($q.reject(new Error('offline')), $q.when(resolvedResult()))
    spyOn(FavoritesService, 'addFavorite').and.returnValue($q.when({ TRAKT_ID: 42 }))

    FavoritesManager.add(searchResult())
    $rootScope.$digest()
    expect(FavoritesService.isError(42)).toBe(true)

    FavoritesManager.add(searchResult())
    expect(FavoritesService.isAdding(42)).toBe(true)
    expect(FavoritesService.isError(42)).toBe(false)
    $rootScope.$digest()
    expect(FavoritesService.getOperation(42).state).toBe('idle')
  })

  it('treats an existing favorite as a completed duplicate command', function() {
    FavoritesService.favoriteIDs = ['42']
    FavoritesService.addError(42, 'old error')
    spyOn(TraktTVv2, 'serie')
    var result

    FavoritesManager.add(searchResult()).then(function(value) { result = value })
    $rootScope.$digest()

    expect(result).toBe(true)
    expect(TraktTVv2.serie).not.toHaveBeenCalled()
    expect(FavoritesService.isAdded(42)).toBe(true)
    expect(FavoritesService.isError(42)).toBe(false)
  })

  it('keeps the compatibility predicates backed by the status record', function() {
    FavoritesService.adding(42, $q.when(true))
    expect(FavoritesService.isAdding(42)).toBe(true)
    expect(FavoritesService.isError(42)).toBe(false)

    FavoritesService.addError(42, 'failed')
    expect(FavoritesService.isAdding(42)).toBe(false)
    expect(FavoritesService.isError(42)).toBe(true)

    FavoritesService.clearError(42)
    expect(FavoritesService.isError(42)).toBe(false)
  })
})
