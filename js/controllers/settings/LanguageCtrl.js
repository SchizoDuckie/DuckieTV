/*
 * Controller for the language settings tab
 */
DuckieTV.controller('LanguageCtrl', ["$scope", "$filter", "$injector", "SettingsService",
    function($scope, $filter, $injector, SettingsService) {

        $scope.activeLocale = SettingsService.get('application.locale');
        $scope.clientLocale = SettingsService.get('client.determinedlocale');

        // Set up the language list used in settings/display template
        $scope.languageList = {
            'el_gr': 'el_gr',
            'en_au': 'au',
            'en_ca': 'ca',
            'en_nz': 'nz',
            'en_uk': 'uk',
            'en_us': 'us',
            'de_de': 'de_de',
            'es_es': 'es_es',
            'fr_ca': 'fr_ca',
            'fr_fr': 'fr_fr',
            'it_it': 'it_it',
            'ja_jp': 'ja_jp',
            'ko_kr': 'ko_kr',
            'nl_nl': 'nl_nl',
            'nb_no': 'nb_no',
            'pt_br': 'pt_br',
            'pt_pt': 'pt_pt',
            'ro_ro': 'ro_ro',
            'ru_ru': 'ru_ru',
            'sl_si': 'sl_si',
            'sv_se': 'sv_se',
            'tr_tr': 'tr_tr',
            'zh_cn': 'zh_cn'
        };

        // Change localization an translations, reloads translation table.
        $scope.setLocale = function(lang) {
            SettingsService.changeLanguage(lang);
            $scope.activeLocale = lang;
            window.location.reload();
        };

        // test if determined locale is one of our supported languages
        $scope.isSupported = function(lang) {
            return lang in $scope.languageList;
        };
    }
]);