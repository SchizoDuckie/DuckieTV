describe('LocaleRegistry', function() {
  var LocaleRegistry, localeDescriptors

  beforeEach(module('DuckieTV'))

  beforeEach(inject(function(_LocaleRegistry_, _localeDescriptors_) {
    LocaleRegistry = _LocaleRegistry_
    localeDescriptors = _localeDescriptors_
  }))

  it('resolves every selectable locale to itself', function() {
    localeDescriptors.forEach(function(descriptor) {
      expect(LocaleRegistry.resolve(descriptor.id)).toBe(descriptor)
      expect(LocaleRegistry.isSupported(descriptor.id)).toBe(true)
    })
  })

  it('resolves every declared alias exactly after case and separator normalization', function() {
    localeDescriptors.forEach(function(descriptor) {
      descriptor.aliases.forEach(function(alias) {
        expect(LocaleRegistry.resolve(alias)).toBe(descriptor)
        expect(LocaleRegistry.resolve(alias.replace(/_/g, '-').toUpperCase())).toBe(descriptor)
      })
    })
  })

  it('preserves deliberate shared translation tables with regional Angular locales', function() {
    expect(LocaleRegistry.resolve('en-AU')).toEqual(jasmine.objectContaining({
      id: 'en_au', translation: 'en_uk', angular: 'en_au', flag: 'en_au'
    }))
    expect(LocaleRegistry.resolve('pt-BR')).toEqual(jasmine.objectContaining({
      id: 'pt_br', translation: 'pt_pt', angular: 'pt_br', flag: 'pt_br'
    }))
    expect(LocaleRegistry.resolve('fr-CA')).toEqual(jasmine.objectContaining({
      id: 'fr_ca', translation: 'fr_fr', angular: 'fr_ca', flag: 'fr_ca'
    }))
  })

  it('falls back unknown and empty values to US English', function() {
    expect(LocaleRegistry.isSupported('not-a-locale')).toBe(false)
    expect(LocaleRegistry.resolve('not-a-locale').id).toBe('en_us')
    expect(LocaleRegistry.resolve(null).id).toBe('en_us')
  })
})

describe('SettingsService locale selection', function() {
  var SettingsService, dynamicLocale, translate

  beforeEach(function() {
    localStorage.removeItem('userPreferences')
  })

  beforeEach(module('DuckieTV', function($provide) {
    dynamicLocale = { set: jasmine.createSpy('set') }
    $provide.value('tmhDynamicLocale', dynamicLocale)
  }))

  beforeEach(inject(function(_SettingsService_, $translate) {
    SettingsService = _SettingsService_
    translate = $translate
    spyOn(translate, 'use')
  }))

  afterEach(function() {
    localStorage.removeItem('userPreferences')
  })

  it('stores one canonical descriptor selection for legacy locale values', function() {
    var selected = SettingsService.changeLanguage('en-AU')

    expect(selected).toBe('en_au')
    expect(SettingsService.get('application.language')).toBe('en_uk')
    expect(SettingsService.get('application.locale')).toBe('en_au')
    expect(dynamicLocale.set).toHaveBeenCalledWith('en_au')
    expect(translate.use).toHaveBeenCalledWith('en_uk')
  })

  it('uses the exact fallback descriptor for unknown values', function() {
    expect(SettingsService.changeLanguage('english-ish')).toBe('en_us')
    expect(dynamicLocale.set).toHaveBeenCalledWith('en_us')
    expect(translate.use).toHaveBeenCalledWith('en_us')
  })
})
