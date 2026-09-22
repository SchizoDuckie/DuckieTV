describe('SeriesMetaTranslations', function() {
  var SeriesMetaTranslations
  var translations = {
    'GENRE.music': 'Musica',
    'GENRE.mystery': 'Mistero',
    'STATUS.ended': 'Terminata',
    'STATUS.returning-series': 'Confermata'
  }

  beforeEach(module('DuckieTV', function($provide) {
    $provide.value('$filter', function(name) {
      if (name !== 'translate') throw new Error('Unexpected filter ' + name)
      return function(key) { return translations[key] || key }
    })
  }))

  beforeEach(inject(function(_SeriesMetaTranslations_) {
    SeriesMetaTranslations = _SeriesMetaTranslations_
  }))

  it('looks genres up by semantic key', function() {
    expect(SeriesMetaTranslations.translateGenre('music')).toBe('Musica')
    expect(SeriesMetaTranslations.translateGenre('mystery')).toBe('Mistero')
  })

  it('looks spaced statuses up by stable hyphenated key', function() {
    expect(SeriesMetaTranslations.translateStatus('ended')).toBe('Terminata')
    expect(SeriesMetaTranslations.translateStatus('returning series')).toBe('Confermata')
  })

  it('retains source strings for unknown or missing translations', function() {
    expect(SeriesMetaTranslations.translateGenre('future-noir')).toBe('future-noir')
    expect(SeriesMetaTranslations.translateGenre('action')).toBe('action')
    expect(SeriesMetaTranslations.translateStatus('paused')).toBe('paused')
  })
})
