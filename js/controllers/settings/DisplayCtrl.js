/**
 * DisplayCtrl containing the controller for the Display Settings and Language Settings
 *
 * Controller for the display settings tab
 */
DuckieTV.controller('DisplayCtrl', ["$scope", "SettingsService",
    function($scope, SettingsService) {

        $scope.hasTopSites = ('chrome' in window && 'topSites' in window.chrome);
        $scope.topSites = SettingsService.get('topSites.enabled');
        $scope.topSitesMode = SettingsService.get('topSites.mode');
        $scope.bgOpacity = SettingsService.get('background-rotator.opacity');
        $scope.showRatings = SettingsService.get('download.ratings');

        $scope.toggleTopSites = function() {
            $scope.topSites = !$scope.topSites;
            SettingsService.set('topSites.enabled', $scope.topSites);
        };
        
        $scope.toggleTopSitesMode = function() {
            $scope.topSitesMode = $scope.topSitesMode == "onhover" ? "onclick" : "onhover";
            SettingsService.set('topSites.mode', $scope.topSitesMode);
        };

        // Set the various background opacity levels.
        $scope.setBGOpacity = function(opacity) {
            SettingsService.set('background-rotator.opacity', opacity);
            $scope.bgOpacity = opacity;
        };

        // Toggles whether to show Ratings on Series and Episode panels
        $scope.toggleRatings = function() {
            $scope.showRatings = !$scope.showRatings;
            SettingsService.set('download.ratings', $scope.showRatings);
        };

    }
])

/*
 * Controller for the language settings tab
 */
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
            'sl_sl': 'sl_sl',
            'zh_cn': 'zh_cn'
        };

        // Change localization an translations, reloads translation table.
        $scope.setLocale = function(lang) {
            SettingsService.changeLanguage(lang);
            $scope.activeLocale = lang;
        };
    }
])