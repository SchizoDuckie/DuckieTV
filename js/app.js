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
    'DuckieTV.providers.scenenames',
    'DuckieTV.providers.settings',
    'DuckieTV.providers.storagesync',
    'DuckieTV.providers.thepiratebay',
    'DuckieTV.providers.generictorrentsearch',
    'DuckieTV.providers.torrentfreak',
    'DuckieTV.providers.trakttv',
    'DuckieTV.providers.upgradenotification',
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
    'DuckieTV.controllers.trakttv',
    'DuckieTV.controllers.watchlist',
    'DuckieTV.directives.calendar',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.backgroundrotator',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.lazybackground',
    'DuckieTV.directives.serieslist',
    'DuckieTV.directives.torrentdialog',
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
        'en_nz', 'en_au', 'en_uk', 'en_us', 'nl_nl', 'de_de', 'es_es', 'fr_fr', 'it_it', 'ja_jp', 'ko_kr', 'pt_pt', 'ru_ru', 'sv_se', 'zh-cn'
    ], {
        'en_ca': 'en_uk',
        'en_gb': 'en_uk',
        'es_419': 'es_es',
        'pt_br': 'pt_pt',
        'de': 'de_de',
        'en': 'en_us',
        'es': 'es_es',
        'fr': 'fr_fr',
        'it': 'it_it',
        'ja': 'jp_jp',
        'ko': 'ko_kr',
        'nl': 'nl_nl',
        'pt': 'pt_pt',
        'ru': 'ru_ru',
        'sv': 'sv_se'
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
                if (window.location.href.indexOf('chrome') === -1 && config.url.indexOf('http') === 0 && config.url.indexOf('localhost') === -1) {
                    //if (config.url.indexOf(".json") == config.url.length - 5 || config.url.indexOf('api.trakt.tv') > -1) {
                    //    // json requests go through this API since it's got less problems with large content blobs
                    //    config.url = ['http://jsonp.jit.su/?url=', encodeURIComponent(config.url)].join('');
                    //} else {
                    // all the other requests go through here, works well for regularxmlhttp requests.
                    config.url = ['http://www.corsproxy.com/', config.url.replace('http://', '').replace('https://', '')].join('')
                    //}
                }
                return config;
            },
            // optional method
            'response': function(response) {
                // do something on success
                return response;
            },

            // optional method
            'responseError': function(rejection) {
                if ('recovered' in rejection.config) {
                    return rejection;
                }
                rejection.config.recovered = true;
                var $http = $injector.get('$http');
                // first create new session server-side
                // rejection.config.url = rejection.config.url.replace('http://www.corsproxy.com/', '');
                return $http(rejection.config);
            }

        }
    }
])
/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {
    //$httpProvider.interceptors.push('xmlHttpInterceptor');
    $httpProvider.interceptors.push('CORSInterceptor');
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|blob|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})

.run(function($rootScope, SettingsService, StorageSyncService, FavoritesService, MigrationService, EpisodeAiredService, UpgradeNotificationService, datePickerConfig, $translate, $injector) {

    // translate the application based on preference or proposed locale
    console.log('client determined locale', $translate.proposedLanguage());
    SettingsService.set('client.determinedlocale', $translate.proposedLanguage());
    var configuredLocale = SettingsService.get('application.locale') || $translate.proposedLanguage;
    SettingsService.changeLanguage('en_us'); // this is the fallback language. any strings not loaded will be in en_us lanague.
    SettingsService.changeLanguage(configuredLocale);
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

    $rootScope.$on('sync:processremoteupdate', function(event, progress) {
		console.log("Process storagesync remote updates!", progress);
		FavoritesService.restore(); // message the favoritesservice something has changed and it needs to refresh.
		StorageSyncService.checkSyncProgress(progress);
	});

    /** 
     * Forward an event to the storagesync service when it's not already syncing.
     * This make sure that local additions / deletions get stored in the cloud.
     */ 
     if(SettingsService.get('storage.sync') == true) {
     	$rootScope.$on('storage:update', function() {
     		console.log("Received storage:update!");
     		if (SettingsService.get('storage.sync') && SettingsService.get('sync.progress') == null) {
	            console.log("Storage sync can run!");
	            SettingsService.set('lastSync', new Date().getTime());
	            StorageSyncService.synchronize();
	        }
	    });
    	if (SettingsService.get('sync.progress') !== null) {
			 $rootScope.$broadcast('sync:processremoteupdate', SettingsService.get('sync.progress'));
    	}   
	}


	/** 
	 * Handle background page message passing and broadcast it as an event.
	 * Used to start the remote deletions processing
	 */ 
	if('chrome' in window && 'runtime' in chrome && 'onMessage' in chrome.runtime) {
		chrome.runtime.onMessage.addListener(function(event, sender, sendResponse) {
			if (event.channel) {
					$rootScope.$broadcast(event.channel, event.eventData);	
		    }
		});
	}


	/** 
	 * Hide the favorites list when navigationg to a different in-page action.
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
    }
})