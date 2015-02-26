/**
 * Handle global dependencies
 */
angular.module('DuckieTV', [
    'ui.router',
    'ngLocale',
    'ngAnimate',
    'tmh.dynamicLocale',
    'datePicker',
    'ui.bootstrap',
    'dialogs.services',
    'pascalprecht.translate',
    'DuckieTV.providers.addic7ed',
    'DuckieTV.providers.chromecast',
    'DuckieTV.providers.episodeaired',
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
    'DuckieTV.providers.tpbmirrorresolver',
    'DuckieTV.providers.trakttvv2',
    'DuckieTV.providers.trakttvupdates',
    'DuckieTV.providers.showrss',
    'DuckieTV.providers.upgradenotification',
    'DuckieTV.providers.watchlistchecker',
    'DuckieTV.providers.watchlist',
    'DuckieTV.providers.trakttvstoragesync',
    'DuckieTV.providers.chromestoragesync',
    'DuckieTV.providers.torrentmonitor',
    'DuckieTV.controllers.about',
    'DuckieTV.controllers.actionbar',
    'DuckieTV.controllers.chromecast',
    'DuckieTV.controllers.episodes',
    'DuckieTV.controllers.serie',
    'DuckieTV.controllers.sidepanel',
    'DuckieTV.controllers.settings',
    'DuckieTV.controllers.backup',
    'DuckieTV.controllers.trakttv',
    'DuckieTV.controllers.watchlist',
    'DuckieTV.directives.calendar',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.backgroundrotator',
    'DuckieTV.directives.chrometopsites',
    'DuckieTV.directives.focuswatch',
    'DuckieTV.directives.lazybackground',
    'DuckieTV.directives.sidepanel',
    'DuckieTV.directives.subtitledialog',
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
.filter('unsafe', ["$sce",
    function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    }
])



/**
 * Routing configuration.
 */
.config(["$stateProvider",
    function($stateProvider) {
        var applyTranslation = function($translate, SettingsService) {
            $translate.use(SettingsService.get('application.locale'));
        }

        function showSidePanel(SidePanelState) {
            SidePanelState.show();
            return SidePanelState;
        }

        function expandSidePanel(SidePanelState) {
            SidePanelState.show();
            SidePanelState.expand();
            return SidePanelState;
        }

        function expandSidePanelIfOpen(SidePanelState) {
            if (SidePanelState.state.isShowing) {
                SidePanelState.expand();
            } else {
                SidePanelState.show();
            }
            return SidePanelState;
        }

        function hideSidePanel(SidePanelState, $rootScope) {
            $rootScope.$broadcast('serieslist:hide');
            $rootScope.$applyAsync();
            SidePanelState.hide();
            return SidePanelState
        }

        function findEpisodes($stateParams) {
            return CRUD.Find('Episode', {
                ID_Season: $stateParams.season_id
            });
        }

        function findEpisode($stateParams) {
            return CRUD.FindOne('Episode', {
                ID_Episode: $stateParams.episode_id
            });
        }

        function findSeasonByID($stateParams) {
            return CRUD.FindOne('Season', {
                ID_Season: $stateParams.season_id
            });
        }

        function findSerieByID($stateParams) {
            return CRUD.FindOne('Serie', {
                ID_Serie: $stateParams.id
            })
        }

        $stateProvider
            .state('calendar', {
                url: '/',
                resolve: {
                    SidePanelState: hideSidePanel
                }
            })
            .state('watchlist', {
                url: '/watchlist',
                resolve: {
                    SidePanelState: expandSidePanel
                },
                views: {
                    sidePanel: {
                        templateUrl: 'templates/watchlist.html',
                        controller: 'WatchlistCtrl'
                    }
                }
            })

        // note: separate state from serie.season.episode navigation because we want to only open the sidepanel from the calendar, not expand it
        .state('episode', {
            url: '/episode/:episode_id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        Episode: {
                            ID_Episode: $stateParams.episode_id
                        }
                    })
                },
                season: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        Episode: {
                            ID_Episode: $stateParams.episode_id
                        }
                    }).then(function(result) {
                        return result.getActiveSeason();
                    });
                },
                episode: findEpisode
            },

            views: {
                'sidePanel': {
                    controller: 'SidepanelEpisodeCtrl',
                    controllerAs: 'sidepanel',
                    templateUrl: 'templates/sidepanel/episode-details.html'
                }
            }
        })

        .state('serie', {
            url: '/series/:id',
            resolve: {
                SidePanelState: showSidePanel,
                serie: findSerieByID,
                latestSeason: function($stateParams) {
                    return CRUD.FindOne('Serie', {
                        ID_Serie: $stateParams.id
                    }).then(function(result) {
                        return result.getActiveSeason();
                    });
                },

            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/serie-overview.html',
                    controller: 'SidepanelSerieCtrl',
                    controllerAs: 'sidepanel'
                }
            }
        })
            .state('serie.details', {
                url: '/details',
                resolve: {
                    SidePanelState: expandSidePanel,
                },
                views: {
                    serieDetails: {
                        templateUrl: 'templates/sidepanel/serie-details.html'
                    }
                }
            })
            .state('serie.seasons', {
                url: '/seasons',
                resolve: {
                    SidePanelState: expandSidePanel,
                    seasons: function($stateParams) {
                        return CRUD.Find('Season', {
                            Serie: {
                                ID_Serie: $stateParams.id
                            }
                        })
                    }
                },
                views: {
                    serieDetails: {
                        controller: 'SidepanelSeasonsCtrl',
                        controllerAs: 'seasons',
                        templateUrl: 'templates/sidepanel/seasons.html'
                    }
                }
            })
        // note: this is a sub state of the serie state. the serie is already resolved here and doesn't need to be redeclared!
        .state('serie.season', {
            url: '/season/:season_id',
            resolve: {
                SidePanelState: expandSidePanel,
                season: findSeasonByID,
                episodes: findEpisodes
            },
            views: {
                serieDetails: {
                    templateUrl: 'templates/sidepanel/episodes.html',
                    controller: 'SidepanelSeasonCtrl',
                    controllerAs: 'season',
                }
            }
        })
        // note: this is a sub state of the serie state. the serie is already resolved here and doesn't need to be redeclared!
        .state('serie.season.episode', {
            url: '/episode/:episode_id',
            resolve: {
                SidePanelState: expandSidePanelIfOpen,
                episode: findEpisode
            },
            views: {
                'sidePanel@': {
                    controller: 'SidepanelEpisodeCtrl',
                    controllerAs: 'sidepanel',
                    templateUrl: 'templates/sidepanel/episode-details.html'
                },
                'serieDetails@serie.season.episode': {
                    templateUrl: 'templates/sidepanel/episodes.html',
                    controller: 'SidepanelSeasonCtrl',
                    controllerAs: 'season',
                }
            }
        })

        .state('settings', {
            url: '/settings',
            resolve: {
                SidePanelState: showSidePanel
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/sidepanel/settings.html',
                }
            }
        })

        .state('settings.tab', {
            url: '/:tab',
            resolve: {
                SidePanelState: expandSidePanel
            },
            views: {
                settingsTab: {
                    templateUrl: function($stateParams) {
                        return 'templates/settings/' + $stateParams.tab + '.html'
                    }
                }
            }
        })

        .state('cast', {
            url: '/cast',
            resolve: {
                SidePanelState: expandSidePanel
            },
            views: {
                sidePanel: {
                    controller: 'ChromeCastCtrl',
                    templateUrl: 'templates/chromecast.html',

                }
            }
        })

        .state('torrent', {
            url: '/torrent',
            resolve: {
                SidePanelState: showSidePanel
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/torrentClient.html',
                    controller: 'TorrentCtrl',
                    controllerAs: 'torrent'
                }
            }
        })

        .state('about', {
            url: '/about',
            resolve: {
                SidePanelState: expandSidePanel
            },
            views: {
                sidePanel: {
                    templateUrl: 'templates/about.html',
                    controller: 'AboutCtrl'
                }
            }
        })
    }
])
/**
 * Translation configuration.
 */
.config(["$translateProvider",
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

/**
 * Inject a (dev-env only) HTTP request interceptor that transparently proxies your requests to an external server and saves them
 */
.factory('TransparentFixtureProxyInterceptor', ['$q', '$injector',
    function($q, $injector) {
        if (document.domain == 'localhost') { // or the domain your dev instance runs on
            return {
                request: function(config) {
                    if (config.url.indexOf('localhost') === -1 && config.url.indexOf('http') === 0) {
                        config.url = './tests/proxy.php?url=' + encodeURIComponent(config.url);
                    }
                    return config;
                }
            };
        } else {
            return {};
        }
    }
])
    .config(["$httpProvider", "$compileProvider",
        function($httpProvider, $compileProvider) {
            if (document.domain == 'localhost') {
                $httpProvider.interceptors.push('TransparentFixtureProxyInterceptor');
            }
        }
    ])

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
.config(["$httpProvider", "$compileProvider",
    function($httpProvider, $compileProvider) {

        if (window.location.href.indexOf('chrome-extension') === -1 && navigator.userAgent.indexOf('DuckieTV') == -1) {
            //  $httpProvider.interceptors.push('CORSInterceptor');
        }
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|blob|mailto|chrome-extension|magnet|data|file):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
    }
])

.run(["$rootScope", "$state", "SettingsService", "StorageSyncService", "FavoritesService", "MigrationService", "TraktTVUpdateService", "TorrentMonitor", "EpisodeAiredService", "UpgradeNotificationService", "datePickerConfig", "$translate", "$injector",
    function($rootScope, $state, SettingsService, StorageSyncService, FavoritesService, MigrationService, TraktTVUpdateService, TorrentMonitor, EpisodeAiredService, UpgradeNotificationService, datePickerConfig, $translate, $injector) {
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

        //$state.transitionTo('calendar');

        StorageSyncService.initialize();

        EpisodeAiredService.attach();
        if (SettingsService.get('torrenting.autodownload') === true) {
            setTimeout(function() {
                $rootScope.$broadcast('episode:aired:check');
            }, 1000);
        }


        /**
         * Catch the event when an episode is marked as watched
         * and forward it to TraktTV if syncing enabled.
         */
        $rootScope.$on('episode:marked:watched', function(evt, episode) {
            //console.log("Mark as watched and sync!");
            if (SettingsService.get('trakttv.sync')) {
                CRUD.FindOne('Serie', {
                    ID_Serie: episode.get('ID_Serie')
                }).then(function(serie) {
                    $injector.get('TraktTVv2').markEpisodeWatched(serie, episode);
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
                    $injector.get('TraktTVv2').markEpisodeNotWatched(serie, episode);
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
        }
    }
]);