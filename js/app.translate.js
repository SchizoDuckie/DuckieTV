/*
 * Translation configuration.
 */
DuckieTV.config(["$translateProvider",
    function($translateProvider) {

        $translateProvider

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

        .registerAvailableLanguageKeys([
            'de_de', 'en_au', 'en_nz', 'en_uk', 'en_us', 'es_es', 'fr_fr', 'it_it', 'ja_jp', 'ko_kr', 'nl_nl', 'pt_pt', 'ru_ru', 'sv_se', 'zh_cn'
        ], {
            'de': 'de_de',
            'de_DE': 'de_de',
            'en': 'en_us',
            'en_US': 'en_us',
            'en_ca': 'en_uk',
            'en_CA': 'en_uk',
            'en_gb': 'en_uk',
            'en_GB': 'en_uk',
            'es': 'es_es',
            'es_ES': 'es_es',
            'es_419': 'es_es',
            'fr': 'fr_fr',
            'fr_ca': 'fr_fr',
            'fr_CA': 'fr_fr',
            'fr_FR': 'fr_fr',
            'it': 'it_it',
            'it_IT': 'it_it',
            'ja': 'ja_jp',
            'ja_JP': 'ja_jp',
            'ko': 'ko_kr',
            'ko_KR': 'ko_kr',
            'nl': 'nl_nl',
            'nl_NL': 'nl_nl',
            'pt': 'pt_pt',
            'pt_PT': 'pt_pt',
            'pt_br': 'pt_pt',
            'pt_BR': 'pt_pt',
            'ru': 'ru_ru',
            'ru_RU': 'ru_ru',
            'sv': 'sv_se',
            'sv_SE': 'sv_se',
            'zh': 'zh_cn',
            'zh_CN': 'zh_cn'
        })

        /*
         * if we cant find a key then search these languages in sequence
         */

        .fallbackLanguage(['en_us'])

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
         * navigator.language
         * navigator.browserLanguage
         * navigator.systemLanguage
         * navigator.userLanguage
         *
         * if it becomes problematic, use $translateProvider.preferredLanguage('en_us'); here to set a default
         * or $translate.use('en_us'); in a controller or service.
         */

        .determinePreferredLanguage();

        // error logging. missing keys are sent to $log
        //$translateProvider.useMissingTranslationHandlerLog();
    }
])

.run(function(SettingsService, $translate, datePickerConfig) {

    SettingsService.set('client.determinedlocale', $translate.proposedLanguage() == undefined ? 'en_us' : angular.lowercase($translate.proposedLanguage()));

    var configuredLocale = SettingsService.get('application.locale') || $translate.proposedLanguage();
    SettingsService.changeLanguage(angular.lowercase(configuredLocale));

    //console.info('client determined locale proposed:', $translate.proposedLanguage(), 'set:', SettingsService.get('client.determinedlocale'), 'configured:', configuredLocale);
    datePickerConfig.startSunday = SettingsService.get('calendar.startSunday');

})