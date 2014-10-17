/**
 * Handle global dependencies
 */
angular.module('DuckieTV', [
    'ngRoute',
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
        'ja': 'jp_jp',
        'ja_JP': 'jp_jp',
        'ko': 'ko_kr',
        'ko_KR': 'ko_kr',
        'nl': 'nl_nl',
        'nl_NL': 'nl_nl',
        'pt': 'pt_pt',
        'pt_PT': 'pt_pt',
        'pt_br': 'pt_pt',
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
                if(config.url.indexOf('http') == 0 && config.url.indexOf('localhost') === -1) {
                    if (config.url.indexOf('www.corsproxy.com') == -1) config.url = ['http://www.corsproxy.com/', config.url.replace('http://', '').replace('https://', '')].join('')
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

        }
    }
])
.factory('HttpErrorInterceptor', function ($q, $rootScope) {
    var $netStats = {
        outstanding: 0,
        error: 0
    };
    return  {
        request: function(config) {
            if(config.url.indexOf('http') > -1) {
                $netStats.outstanding++;
                $rootScope.$broadcast('http:stats', ['request', $netStats]);
            }
            return config;
        },
        response: function(response) {
            if(response.config.url.indexOf('http') > -1) {
                $netStats.outstanding--;
                $rootScope.$broadcast('http:stats', ['response', $netStats]);
            }
            return response;
        },
        requestError: function (request) {
          $netStats.error++;
          $netStats.outstanding--;
          $rootScope.$broadcast('http:stats', ['requestError', request, $netStats]);
          return request;
        },
        responseError: function (response) {
          $netStats.error++;
          $netStats.outstanding--;
          $rootScope.$broadcast('http:stats', ['responseError', response, $netStats]);
          return response;
        }
      };
})
/*
  .config(function($provide) {
    var count = window.promiseStats = {
        open: 0,
        done: 0,
        promises: {}
    };
    $provide.decorator('$q', function($delegate) {
        var defer = $delegate.defer;
        $delegate.defer = function() {

            count.open++;
            var traceId = count.open;
            if(traceId == 61) { 
                debugger;
            }
            var deferred = count.promises[traceId] = defer();
            console.timeline('promise ' +traceId);
            console.profile('promise '+traceId);
            
            deferred.promise.finally(function() {
                count.done++;
                console.timelineEnd('promise ' +traceId);
                console.profileEnd('promise '+traceId);
                delete count.promises[traceId];    
            });
            deferred.promise.catch(function() {
                count.done++;
                                console.timelineEnd('promise ' +traceId);
                console.profileEnd('promise '+traceId);
                delete count.promises[traceId];    

            })
            return deferred;
        };
        return $delegate;
    });
}) */
/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {

    if (window.location.href.indexOf('chrome-extension') === -1) {
        $httpProvider.interceptors.push('CORSInterceptor');
    }
    //$httpProvider.interceptors.push('HttpErrorInterceptor');
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|blob|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})

.run(function($rootScope, SettingsService, StorageSyncService, FavoritesService, MigrationService, EpisodeAiredService, UpgradeNotificationService, datePickerConfig, $translate, $injector) {
    // translate the application based on preference or proposed locale
    
    FavoritesService.loadRandomBackground();
               
    console.info('client determined locale', angular.lowercase($translate.proposedLanguage()));
    SettingsService.set('client.determinedlocale', angular.lowercase($translate.proposedLanguage()));
    var configuredLocale = SettingsService.get('application.locale') || angular.lowercase($translate.proposedLanguage);
    SettingsService.changeLanguage('en_us'); // this is the fall-back language. any strings not loaded will be in en_us language.
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

    $rootScope.$on('http:stats', function(error, stats) {
        console.error(" HTTP request! " , stats[0], stats[1]);
    });

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
