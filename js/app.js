/**
 * Handle global dependencies
 */


angular.module('DuckieTV', [
    'ngRoute',
    'ngAnimate',
    'ngLocale',
    'tmh.dynamicLocale',
    'datePicker',
    'ui.bootstrap',
    'dialogs.services',
    'pascalprecht.translate',
    'DuckieTV.providers.chromecast',
    'DuckieTV.providers.episodeaired',
    'DuckieTV.providers.eventwatcher',
    'DuckieTV.providers.eventscheduler',
    'DuckieTV.providers.favorites',
    'DuckieTV.providers.filereader',
    'DuckieTV.providers.googleimages',
    'DuckieTV.providers.imdb',
    'DuckieTV.providers.kickasstorrents',
    'DuckieTV.providers.mirrorresolver',
    'DuckieTV.providers.migrations',
    'DuckieTV.providers.notifications',
    'DuckieTV.providers.piratebayChecker',
    'DuckieTV.providers.scenenames',
    'DuckieTV.providers.settings',
    'DuckieTV.providers.storagesync',
    'DuckieTV.providers.thepiratebay',
    'DuckieTV.providers.generictorrentsearch',
    'DuckieTV.providers.thetvdb',
    'DuckieTV.providers.torrentfreak',
    'DuckieTV.providers.trakttv',
    'DuckieTV.providers.watchlistchecker',
    'DuckieTV.providers.watchlist',
    'DuckieTV.controllers.about',
    'DuckieTV.controllers.main',
    'DuckieTV.controllers.chromecast',
    'DuckieTV.controllers.episodes',
    'DuckieTV.controllers.serie',
    'DuckieTV.controllers.settings',
    'DuckieTV.controllers.backup',
    'DuckieTV.controllers.timer',
    'DuckieTV.controllers.watchlist',
    'DuckieTV.directives.calendar',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.backgroundrotator',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.lazybackground',
    'DuckieTV.directives.serieslist',
    'DuckieTV.directives.torrentdialog',
    'DuckieTorrent.controllers',
    'DuckieTorrent.torrent',
    'colorpicker.module'
])
/**
 * Unsafe HTML entities passthrough.
 * (Used for for instance typeAheadIMDB.html)
 */
.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
})
/**
 * Routing configuration.
 */
.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'templates/home.html',
            controller: 'MainCtrl'
        })
        .when('/watchlist', {
            templateUrl: 'templates/watchlist.html',
            controller: 'WatchlistCtrl'
        })
        .when('/series/:id', {
            templateUrl: 'templates/serie.html',
            controller: 'SerieCtrl'
        })
        .when('/serie/:id/episode/:episode', {
            templateUrl: 'templates/episode.html',
            controller: 'EpisodeCtrl'
        })
        .when('/settings', {
            templateUrl: 'templates/settings.html',
            controller: 'SettingsCtrl'
        })
        .when('/cast', {
            templateUrl: 'templates/chromecast.html',
            controller: 'ChromeCastCtrl'
        })
        .when('/torrent', {
            templateUrl: 'templates/torrentClient.html',
            controller: 'TorrentCtrl'
        })
        .when('/about', {
            templateUrl: 'templates/about.html',
            controller: 'AboutCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
})
/**
 * Translation configuration.
 */
.config(function($translateProvider) {
    /*
     * setup path to the translation table files
     * example ../Locale-en_us.json
     */
    $translateProvider.useStaticFilesLoader({
        prefix: '_locales/',
        suffix: '.json'
    });

    // help the determinePreferredLanguage module match a find with one of our provided languages
    $translateProvider.registerAvailableLanguageKeys([
        'en_nz', 'en_uk', 'en_us', 'nl_nl'
    ], {
        'en_au': 'en_nz',
        'en_ca': 'en_nz',
        'en_gb': 'en_uk'
    });
    // if we cant find a match then use this language
    $translateProvider.fallbackLanguage('en_us');
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
    $translateProvider.determinePreferredLanguage();
    // error handling. missing keys are sent to $log
    //$translateProvider.useMissingTranslationHandlerLog();

})
/**
 * Inject a cross-domain enabling http proxy for the non-chrome extension function
 * Sweeeeet
 */
.factory('CORSInterceptor', ['$q',
    function($q) {
        return {
            request: function(config) {
                if (window.location.href.indexOf('chrome') === -1 && config.url.indexOf('http') === 0 && config.url.indexOf('localhost') === -1) {
                    config.url = ['http://www.corsproxy.com/', config.url.replace('http://', '').replace('https://', '')].join('')
                }
                return config;
            }
        };
    }
])
/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {
    //$httpProvider.interceptors.push('xmlHttpInterceptor');
    $httpProvider.interceptors.push('CORSInterceptor');
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})


.run(function($rootScope, SettingsService, StorageSyncService, MigrationService, datePickerConfig, $translate, tmhDynamicLocale) {

    /*
     * if the user has previously set the locale, over-ride the determinePreferredLanguage proposed id
     * but remember the determination, it's used as an option in the locale settings page
     */
    $rootScope.determinedLocale = $rootScope.determinedLocale || $translate.proposedLanguage();
    $translate.use(SettingsService.get('locale'));
    tmhDynamicLocale.set($translate.proposedLanguage());
    console.log("Locale being used", $translate.proposedLanguage());

    datePickerConfig.startSunday = SettingsService.get('calendar.startSunday');

    $rootScope.getSetting = function(key) {
        if (key == 'cast.supported') {
            return ('cast' in chrome && 'Capability' in chrome.cast && 'VIDEO_OUT' in chrome.cast.Capability);
        }
        return SettingsService.get(key);
    };

    $rootScope.setSetting = function(key, value) {
        return SettingsService.set(key, value);
    };

    $rootScope.enableSetting = function(key) {
        SettingsService.set(key, true);
    };

    $rootScope.disableSetting = function(key) {
        SettingsService.set(key, false);
    };

    $rootScope.$on('storage:update', function() {
        /* if ($rootScope.getSetting('storage.sync') == true) {
    console.log("STorage sync can run!");
    StorageSyncService.readIfSynced();
    StorageSyncService.synchronize();
}*/
    });

    $rootScope.$on('$locationChangeSuccess', function() {
        $rootScope.$broadcast('serieslist:hide');
    });

    // global variable translator
    $rootScope.translateVar = function(data) {
        return {
            value: data
        };
    };

    MigrationService.check();

    // delay loading of chromecast because it's creating a load delay in the rest of the scripts.
    setTimeout(function() {
        var s = document.createElement('script');
        s.src = './js/vendor/cast_sender.js';
        document.body.appendChild(s);
    }, 5000);
})