/**
 * Handle global dependencies
 */
angular.module('DuckieTV', [
    'ngRoute',
    'ngLocale',
    'ngAnimate',
    'tmh.dynamicLocale',
    'datePicker',
    'ui.bootstrap',
    'dialogs.services',
    'pascalprecht.translate',

    'DuckieTV.providers.alarms',
    'DuckieTV.providers.chromecast',
    'DuckieTV.providers.episodeaired',
    'DuckieTV.providers.eventwatcher',
    'DuckieTV.providers.eventscheduler',
    'DuckieTV.providers.favorites',
    'DuckieTV.providers.filereader',
    'DuckieTV.providers.googleimages',
    'DuckieTV.providers.imdb',
    'DuckieTV.providers.kickassmirrorresolver',
    'DuckieTV.providers.migrations',
    'DuckieTV.providers.notifications',
    'DuckieTV.providers.scenenames',
    'DuckieTV.providers.settings',
    'DuckieTV.providers.storagesync',
    'DuckieTV.providers.generictorrentsearch',
    'DuckieTV.providers.torrentfreak',
    'DuckieTV.providers.trakttv',
    'DuckieTV.providers.trakttvv2',
    'DuckieTV.providers.upgradenotification',
    'DuckieTV.providers.watchlistchecker',
    'DuckieTV.providers.watchlist',
    'DuckieTV.providers.trakttvstoragesync',
    'DuckieTV.providers.chromestoragesync',
    'DuckieTV.controllers.about',
    'DuckieTV.controllers.main',
    'DuckieTV.controllers.chromecast',
    'DuckieTV.controllers.episodes',
    'DuckieTV.controllers.serie',
    'DuckieTV.controllers.settings',
    'DuckieTV.controllers.backup',
    'DuckieTV.controllers.timer',
    'DuckieTV.controllers.trakttv',
    'DuckieTV.controllers.watchlist',
    'DuckieTV.directives.calendar',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.backgroundrotator',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.lazybackground',
    'DuckieTV.directives.serieslist',
    'DuckieTV.directives.torrentdialog',
    'DuckieTV.directives.querymonitor',
    'DuckieTorrent.controllers',
    'DuckieTorrent.torrent'
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
            redirectTo: '/settings/default'
        })
        .when('/settings/:tab', {
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
})
/**
 * Inject a cross-domain enabling http proxy for the non-chrome extension function
 * Sweeeeet
 */
.factory('CORSInterceptor', ['$q', '$injector',
    function($q, $injector) {
        return {
            request: function(config) {
                if (document.domain != 'localhost' && config.url.indexOf('http') == 0 && config.url.indexOf('localhost') === -1) {
                    if (config.url.indexOf('www.corsproxy.com') == -1) config.url = ['http://www.corsproxy.com/', config.url.replace('http://', '').replace('https://', '')].join('')
                } else if (document.domain == 'localhost' && config.url.indexOf('localhost') === -1 && config.url.indexOf('http') == 0) {
                    // for local protractor tests
                    config.url = './tests/proxy.php?url=' + encodeURIComponent(config.url);
                }
                return config;
            },
            'responseError': function(rejection) {
                if ('recovered' in rejection.config) {
                    return rejection;
                }
                rejection.config.recovered = true;
                var $http = $injector.get('$http');
                return $http(rejection.config);
            }

        };
    }
])


/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {

    if (window.location.href.indexOf('chrome-extension') === -1 && navigator.userAgent.indexOf('DuckieTV') == -1) {
        $httpProvider.interceptors.push('CORSInterceptor');
    }
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|blob|mailto|chrome-extension|magnet|data|file):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})

.run(function($rootScope, SettingsService, StorageSyncService, EventWatcherService, FavoritesService, MigrationService, EpisodeAiredService, UpgradeNotificationService, datePickerConfig, $translate, $injector) {
    // translate the application based on preference or proposed locale

    FavoritesService.loadRandomBackground();

    SettingsService.set('client.determinedlocale', $translate.proposedLanguage() == undefined ? 'en_us' : angular.lowercase($translate.proposedLanguage()));

    var configuredLocale = SettingsService.get('application.locale') || $translate.proposedLanguage();
    SettingsService.changeLanguage(angular.lowercase(configuredLocale));

    //console.info('client determined locale proposed:', $translate.proposedLanguage(), 'set:', SettingsService.get('client.determinedlocale'), 'configured:', configuredLocale);
    datePickerConfig.startSunday = SettingsService.get('calendar.startSunday');

    $rootScope.getSetting = function(key) {
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

    StorageSyncService.initialize();

    /**
     * If we're not a chrome extension, Attach the event watcher that runs the timers
     */
    if (!('chrome' in window) || (chrome in window && !('alarms' in window.chrome))) {
        EventWatcherService.initialize();
    }

    /** 
     * Handle background page message passing and broadcast it as an event.
     * Used to start the remote deletions processing
     */
    if ('chrome' in window && 'runtime' in chrome && 'onMessage' in chrome.runtime) {
        chrome.runtime.onMessage.addListener(function(event, sender, sendResponse) {
            if (event.channel) {
                $rootScope.$broadcast(event.channel, event.eventData);
            }
        });
    }


    /** 
     * Hide the favorites list when navigating to a different in-page action.
     */
    $rootScope.$on('$locationChangeSuccess', function() {
        $rootScope.$broadcast('serieslist:hide');
    });

    /**
     * Catch the event when an episode is marked as watched
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:watched', function(evt, episode) {
        if (SettingsService.get('trakttv.sync')) {
            CRUD.FindOne('Serie', {
                ID_Serie: episode.get('ID_Serie')
            }).then(function(serie) {
                $injector.get('TraktTV').markEpisodeWatched(serie, episode);
            });
        }
    });
    /**
     * Catch the event when an episode is marked as NOT watched
     * and forward it to TraktTV if syncing enabled.
     */
    $rootScope.$on('episode:marked:notwatched', function(evt, episode) {
        if (SettingsService.get('trakttv.sync')) {
            CRUD.FindOne('Serie', {
                ID_Serie: episode.get('ID_Serie')
            }).then(function(serie) {
                $injector.get('TraktTV').markEpisodeNotWatched(serie, episode);
            });
        }
    });


    // delay loading of chromecast because it's creating a load delay in the rest of the scripts.
    if ('chrome' in window && navigator.vendor.indexOf('Google') > -1) {
        setTimeout(function() {
            var s = document.createElement('script');
            s.src = './js/vendor/cast_sender.js';
            document.body.appendChild(s);
        }, 5000);
    };

    // system tray settings for Standalone
    if (navigator.userAgent.toUpperCase().indexOf('STANDALONE') != -1) {
        // Load library
        var gui = require('nw.gui');

        // Reference to window and tray
        var win = gui.Window.get();
        var tray;

        // Get the minimize event
        win.on('minimize', function() {
            // Hide window
            this.hide();

            // Show tray
            tray = new gui.Tray({
                icon: 'img/icon64.png'
            });

            // Show window and remove tray when clicked
            tray.on('click', function() {
                win.show();
                this.remove();
                tray = null;
            });
        });
    };
});