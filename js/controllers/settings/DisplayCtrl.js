/*
 * Controller for the display settings tab
 */
DuckieTV.controller('DisplayCtrl', ["$scope", "$rootScope", "SettingsService",
    function($scope, $rootScope, SettingsService) {

        $scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);
        $scope.topSites = SettingsService.get('topSites.enabled');
        $scope.topSitesMode = SettingsService.get('topSites.mode');
        $scope.bgOpacity = SettingsService.get('background-rotator.opacity');

        $scope.toggleTopSites = function() {
            if ($scope.topSites == true) {
                SettingsService.set('topSites.enabled', false);
                $scope.topSites = false;
            } else {
                SettingsService.set('topSites.enabled', true);
                $scope.topSites = true;  
            }
        }
        $scope.toggleTopSitesMode = function() {
            if ($scope.topSitesMode == "onhover") {
                SettingsService.set('topSites.mode', "onclick");
                $scope.topSitesMode = "onclick";
            } else {
                SettingsService.set('topSites.mode', "onhover");
                $scope.topSitesMode = "onhover";  
            }
        }

        // Set the various background opacity levels.
        $scope.setBGOpacity = function(opacity) {
            SettingsService.set('background-rotator.opacity', opacity);
            $scope.bgOpacity = opacity;
        };
    }
])

DuckieTV.controller('LanguageCtrl', ["$scope", "$filter", "SettingsService",
    function($scope, $filter, SettingsService) {
        $scope.activeLocale = SettingsService.get('application.locale');

        // Set up the language list used in settings/display template
        $scope.languageList = {
            'en_au': 'au',
            'en_ca': 'ca',
            'en_nz': 'nz',
            'en_uk': 'uk',
            'en_us': 'us',
            'de_de': 'de_de',
            'es_419': 'es_419',
            'es_es': 'es_es',
            'fr_ca': 'fr_ca',
            'fr_fr': 'fr_fr',
            'it_it': 'it_it',
            'ja_jp': 'ja_jp',
            'ko_kr': 'ko_kr',
            'nl_nl': 'nl_nl',
            'pt_br': 'pt_br',
            'pt_pt': 'pt_pt',
            'ru_ru': 'ru_ru',
            'sv_se': 'sv_se',
            'zh_cn': 'zh_cn'
        };

        // Change localization an translations, reloads translation table.
        $scope.setLocale = function(lang) {
            SettingsService.changeLanguage(lang);
            $scope.activeLocale = lang;
        };
    }
])