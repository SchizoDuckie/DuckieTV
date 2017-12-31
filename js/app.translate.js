/*
 * Translation configuration.
 */
DuckieTV

.constant('availableLanguageKeys', [
    'de_de', 'el_gr', 'en_uk', 'en_us', 'es_es', 'fr_fr', 'it_it', 'ja_jp', 'ko_kr', 'nb_no', 'nl_nl', 'pt_pt', 'ro_ro', 'ru_ru', 'sl_si', 'sv_se', 'tr_tr', 'zh_cn'
])

.constant('customLanguageKeyMappings', {
    'au': 'en_uk',
    'ca': 'en_uk',
    'de': 'de_de',
    'de_DE': 'de_de',
    'el_GR': 'el_gr',
    'en': 'en_us',
    'en_AU': 'en_uk',
    'en_au': 'en_uk',
    'en_AU': 'en_uk',
    'en_ca': 'en_uk',
    'en_CA': 'en_uk',
    'en_gb': 'en_uk',
    'en_GB': 'en_uk',
    'en_nz': 'en_uk',
    'en_NZ': 'en_uk',
    'en_UK': 'en_uk',
    'en_US': 'en_us',
    'es': 'es_es',
    'es_ES': 'es_es',
    'fr': 'fr_fr',
    'fr_ca': 'fr_fr',
    'fr_CA': 'fr_fr',
    'fr_FR': 'fr_fr',
    'gb': 'en_uk',
    'it': 'it_it',
    'it_IT': 'it_it',
    'ja': 'ja_jp',
    'ja_JP': 'ja_jp',
    'ko': 'ko_kr',
    'ko_KR': 'ko_kr',
    'nb': 'nb_no',
    'nb_NO': 'nb_no',
    'nl': 'nl_nl',
    'nl_NL': 'nl_nl',
    'nz': 'en_uk',
    'pt': 'pt_pt',
    'pt_br': 'pt_pt',
    'pt_BR': 'pt_pt',
    'pt_PT': 'pt_pt',
    'ro_RO': 'ro_ro',
    'ru': 'ru_ru',
    'ru_RU': 'ru_ru',
    'si': 'sl_si',
    'sl_SI': 'sl_si',
    'sv': 'sv_se',
    'sv_SE': 'sv_se',
    'tr': 'tr_tr',
    'tr_TR': 'tr_tr',
    'uk': 'en_uk',
    'zh': 'zh_cn',
    'zh_CN': 'zh_cn'
})


.config(["$translateProvider", "availableLanguageKeys", "customLanguageKeyMappings",
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
        .useMissingTranslationHandler('duckietvMissingTranslationHandler');
    }
])

/*
 * Custom Missing Translation key Handler
 */
.factory("duckietvMissingTranslationHandler", ["$translate", "SettingsService",
    function($translate, SettingsService) {
        var previousKeys = []; // list of missing keys we have processed once already
        var appLocale = SettingsService.get('application.locale'); // the application language the user wants

        return function(translationID, lang) {
            if (typeof lang === 'undefined') {
                // ignore translation errors until the appLocale's translation table has been loaded
                return translationID;
            }
            if (previousKeys.indexOf(lang + translationID) !== -1) {
                // we have had this key already, do nothing
                return translationID;
            } else {
                // first time we have had this key, log it
                previousKeys.push(lang + translationID);
                console.warn("Translation for (" + lang + ") key " + translationID + " doesn't exist");
                return translationID;
            }
        };
    }
])

.run(["SettingsService", "$translate", "datePickerConfig", function(SettingsService, $translate, datePickerConfig) {

    SettingsService.set('client.determinedlocale', $translate.proposedLanguage() === undefined ? 'en_us' : angular.lowercase($translate.proposedLanguage()));

    var configuredLocale = SettingsService.get('application.locale') || $translate.proposedLanguage();
    var finalLocale = SettingsService.changeLanguage(angular.lowercase(configuredLocale), $translate.proposedLanguage());

    if (finalLocale != configuredLocale) {
        SettingsService.set('application.locale', finalLocale);
    }
    datePickerConfig.startSunday = SettingsService.get('calendar.startSunday');

}]);