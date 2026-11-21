describe('TraktTVv2 series requests', function() {
  var http
  var TraktTVv2

  beforeEach(module('DuckieTV', function($provide) {
    http = jasmine.createSpy('$http').and.callFake(function(request) {
      if (request.url.indexOf('/seasons?') > -1) {
        return Promise.resolve({ data: [] })
      }

      return Promise.resolve({
        data: {
          title: 'Example Show',
          ids: { trakt: 42, tvdb: 7 }
        }
      })
    })
    $provide.value('$http', http)
  }))

  beforeEach(inject(function(_TraktTVv2_) {
    TraktTVv2 = _TraktTVv2_
  }))

  it('loads a show without requesting cast and crew', async function() {
    var serie = await TraktTVv2.serie(42)
    var urls = http.calls.allArgs().map(function(args) {
      return args[0].url
    })

    expect(serie.seasons).toEqual([])
    expect(urls.length).toBe(2)
    expect(urls[0]).toContain('/shows/42?extended=full')
    expect(urls[1]).toContain('/shows/42/seasons?extended=full')
    expect(urls.some(function(url) { return url.indexOf('/people') > -1 })).toBe(false)
  })

  it('reports seasons as their episode requests finish', async function() {
    var show = { trakt_id: 42 }
    var finishFirstSeason
    var slowSeason = new Promise(function(resolve) { finishFirstSeason = resolve })
    var progress = jasmine.createSpy('season progress').and.callFake(function(completed) {
      if (completed === 1) finishFirstSeason([{ season: 1, number: 1 }])
    })
    spyOn(TraktTVv2, 'seasons').and.resolveTo([{ number: 1 }, { number: 2 }])
    spyOn(TraktTVv2, 'episodes').and.callFake(function(id, season) {
      return season === 1 ? slowSeason : Promise.resolve([{ season: 2, number: 1 }])
    })

    var result = await TraktTVv2.serie(42, show, false, progress)

    expect(progress.calls.allArgs()).toEqual([[0, 2], [1, 2], [2, 2]])
    expect(result.seasons[0].episodes).toEqual([{ season: 1, number: 1 }])
    expect(result.seasons[1].episodes).toEqual([{ season: 2, number: 1 }])
  })
})
