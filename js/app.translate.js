/*
 * Translation configuration.
 */
/* global DuckieTVLocaleDescriptors */
var availableLanguageKeys = DuckieTVLocaleDescriptors.reduce(function(keys, descriptor) {
  if (keys.indexOf(descriptor.translation) === -1) keys.push(descriptor.translation)
  return keys
}, [])

var customLanguageKeyMappings = DuckieTVLocaleDescriptors.reduce(function(mappings, descriptor) {
  if (descriptor.id !== descriptor.translation) mappings[descriptor.id] = descriptor.translation
  descriptor.aliases.forEach(function(alias) {
    mappings[alias] = descriptor.translation
    mappings[alias.toLowerCase().replace(/-/g, '_')] = descriptor.translation
    mappings[alias.replace(/_/g, '-')] = descriptor.translation
    mappings[alias.toLowerCase().replace(/_/g, '-')] = descriptor.translation
  })
  return mappings
}, {})

DuckieTV
  .constant('localeDescriptors', DuckieTVLocaleDescriptors)
  .constant('availableLanguageKeys', availableLanguageKeys)
  .constant('customLanguageKeyMappings', customLanguageKeyMappings)

  .factory('LocaleRegistry', ['localeDescriptors', function(localeDescriptors) {
    function normalize(value) {
      return (value || '').toString().trim().toLowerCase().replace(/-/g, '_')
    }

    var byKey = {}
    localeDescriptors.forEach(function(descriptor) {
      byKey[normalize(descriptor.id)] = descriptor
    })
    localeDescriptors.forEach(function(descriptor) {
      descriptor.aliases.concat([descriptor.translation, descriptor.angular]).forEach(function(alias) {
        var key = normalize(alias)
        if (!(key in byKey)) byKey[key] = descriptor
      })
    })

    return {
      selectable: localeDescriptors,
      normalize: normalize,
      find: function(value) {
        return byKey[normalize(value)] || null
      },
      resolve: function(value) {
        return this.find(value) || byKey.en_us
      },
      isSupported: function(value) {
        return this.find(value) !== null
      }
    }
  }])

  .config(['$translateProvider', 'availableLanguageKeys', 'customLanguageKeyMappings',
    function($translateProvider, availableLanguageKeys, customLanguageKeyMappings) {
      $translateProvider
        /*
         * Escape all outputs from Angular Translate for security, not that
         * it is really needed in this case but it stops throwing a warning
         */
        .useSanitizeValueStrategy('escaped')

        /*
         * setup path to the translation table files
         * example ../_Locales/en_us.json
         */
        .useStaticFilesLoader({
          prefix: '_locales/',
          suffix: '.json'
        })

        /*
         * help the determinePreferredLanguage module match a find
         * with one of our provided languages
         */
        .registerAvailableLanguageKeys(availableLanguageKeys, customLanguageKeyMappings)

        /*
         * default language
         */
        .preferredLanguage('en_us')

      /*
         * determine the local language
         *
         * Using this method at our own risk! Be aware that each browser can return different values on these properties.
         * It searches for values in the window.navigator object in the following properties (also in this order):
         *
         * navigator.languages[0]
         * navigator.language
         * navigator.browserLanguage
         * navigator.systemLanguage
         * navigator.userLanguage
         *
         * if it becomes problematic, use $translateProvider.preferredLanguage('en_us'); here to set a default
         * or $translate.use('en_us'); in a controller or service.
         */

        .fallbackLanguage('en_us')
        .use('en_us')

        .determinePreferredLanguage()

        // error logging. missing keys are sent to $log
        .useMissingTranslationHandler('duckietvMissingTranslationHandler')
    }
  ])

/*
 * Custom Missing Translation key Handler
 */
  .factory('duckietvMissingTranslationHandler', [function() {
    var previousKeys = [] // list of missing keys we have processed once already

    return function(translationID, lang) {
      if (typeof lang === 'undefined') {
        // ignore translation errors until the selected translation table has been loaded
        return translationID
      }
      if (previousKeys.indexOf(lang + translationID) !== -1) {
        // we have had this key already, do nothing
        return translationID
      } else {
        // first time we have had this key, log it
        previousKeys.push(lang + translationID)
        console.warn('Translation for (' + lang + ') key ' + translationID + " doesn't exist")
        return translationID
      }
    }
  }])

  .run(['SettingsService', 'LocaleRegistry', '$translate', 'datePickerConfig', function(SettingsService, LocaleRegistry, $translate, datePickerConfig) {
    var proposedLocale = $translate.proposedLanguage()
    var browserLocale = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.browserLanguage || navigator.systemLanguage || navigator.userLanguage || proposedLocale
    var detectedLocale = LocaleRegistry.resolve(browserLocale).id
    SettingsService.set('client.determinedlocale', detectedLocale)

    var configuredLocale = SettingsService.get('application.locale') || detectedLocale
    var finalLocale = SettingsService.changeLanguage(configuredLocale, detectedLocale)

    if (finalLocale !== configuredLocale) {
      SettingsService.set('application.locale', finalLocale)
    }
    datePickerConfig.startSunday = SettingsService.get('calendar.startSunday')
  }])
