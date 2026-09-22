describe('TorrentResultPolicy', function() {
  var TorrentResultPolicy

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function(_TorrentResultPolicy_) {
    TorrentResultPolicy = _TorrentResultPolicy_
  }))

  function apply(results, overrides) {
    return TorrentResultPolicy.filter(results, angular.extend({
      scoreQuery: 'Example Show S01E02',
      primaryQuery: 'Example Show S01E02',
      stripSearchPunctuation: true,
      negativeTermsPass: true,
      requireAny: false,
      requiredKeywords: '',
      ignoredKeywords: '',
      sizeMin: 0,
      sizeMax: Number.MAX_SAFE_INTEGER,
      minSeedersEnabled: false,
      minSeeders: 0,
      deduplicate: false
    }, overrides)).items
  }

  function result(name, size, seeders, detailUrl) {
    return { releasename: name, size: size, seeders: seeders, detailUrl: detailUrl }
  }

  it('matches every score word while preserving manual punctuation and minus-word behavior', function() {
    var items = [
      result('Example.Show.S01E02.1080p', '800 MB', '20'),
      result('Example.Show.S01E03.1080p', '800 MB', '20')
    ]

    expect(apply(items, { scoreQuery: '"Example" +Show S01E02 -ignored' })).toEqual([items[0]])
  })

  it('encodes Any and All required-keyword modes through explicit policy', function() {
    var web = result('Example Show S01E02 WEB', '800 MB', '20')
    var bluray = result('Example Show S01E02 Bluray', '800 MB', '20')

    expect(apply([web, bluray], { requireAny: true, requiredKeywords: 'web x265' })).toEqual([web])
    expect(apply([web, bluray], { scoreQuery: 'Example Show S01E02 web x265' })).toEqual([])
  })

  it('applies exclusions but protects words that are part of the primary query', function() {
    var protectedWord = result('The Bad Show S01E02', '800 MB', '20')
    var excludedWord = result('Example Show S01E02 CAM', '800 MB', '20')

    expect(apply([protectedWord], {
      scoreQuery: 'The Bad Show S01E02',
      primaryQuery: 'The Bad Show S01E02',
      ignoredKeywords: 'bad cam'
    })).toEqual([protectedWord])
    expect(apply([excludedWord], { ignoredKeywords: 'bad cam' })).toEqual([])
  })

  it('accepts missing size and seeders while enforcing configured bounds', function() {
    var missing = result('Example Show S01E02 missing', 'n/a', 'n/a')
    var small = result('Example Show S01E02 small', '99 MB', '50')
    var accepted = result('Example Show S01E02 accepted', '500 MB', '10')
    var large = result('Example Show S01E02 large', '1001 MB', '50')

    expect(apply([missing, small, accepted, large], {
      sizeMin: 100,
      sizeMax: 1000,
      minSeedersEnabled: true,
      minSeeders: 10
    })).toEqual([missing, accepted])
  })

  it('uses the explicit bounds supplied by each caller', function() {
    var item = result('Example Show S01E02', '700 MB', '20')

    expect(apply([item], { sizeMin: 800 })).toEqual([])
    expect(apply([item], { sizeMin: 600 })).toEqual([item])
  })

  it('deduplicates by detail URL or release name and keeps ShowRSS results when requested', function() {
    var first = result('Example Show S01E02 first', '700 MB', '20', 'same')
    var replacement = result('Example Show S01E02 replacement', '750 MB', '30', 'same')

    expect(apply([first, replacement], { deduplicate: true })).toEqual([replacement])
    expect(apply([first, replacement], { deduplicate: false })).toEqual([first, replacement])
  })

  it('reports the stage that removed automatic-download candidates', function() {
    var output = TorrentResultPolicy.filter([
      result('Example Show S01E02', '700 MB', '2')
    ], {
      scoreQuery: 'Example Show S01E02',
      primaryQuery: 'Example Show S01E02',
      requireAny: false,
      ignoredKeywords: '',
      sizeMin: 0,
      sizeMax: 1000,
      minSeedersEnabled: true,
      minSeeders: 10,
      stages: ['score', 'required', 'ignored', 'size', 'seeders']
    })

    expect(output.counts.size).toBe(1)
    expect(output.counts.seeders).toBe(0)
    expect(output.snapshots.size[0].seeders).toBe('2')
  })
})
