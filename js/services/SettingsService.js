/**
 * Wrapper from accessing and requesting chrome permissions
 */
DuckieTV.factory('ChromePermissions', ["$q",
    function($q) {
        var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
            isExtension = (('chrome' in window) && ('permissions' in chrome)),
            isOpera = navigator.vendor.toLowerCase().indexOf('opera');

        var service = {
            /**
             * Storage sync only supported in chrome extensions
             */
            isSupported: function() {
                return isChrome && isExtension;
            },
            /**
             * Verify that a permission is available in chrome
             */
            checkGranted: function(permission) {
                return $q(function(resolve, reject) {
                    console.info('Verify if permission is granted', permission);

                    if (!service.isSupported()) {
                        console.info('Nope, not chrome or an extension');
                        reject();
                    }
                    chrome.permissions.contains({
                        permissions: [permission]
                    }, function(supported) {
                        console.info(supported ? 'Permission ' + permission + ' granted.' : 'Permission ' + permission + ' denied.');
                        return (supported && 'sync' in chrome.storage) ? resolve() : reject();
                    });
                });
            },
            requestPermission: function(permission) {
                return $q(function(resolve, reject) {
                    console.info('Request permission', permission);

                    if (!service.isSupported()) {
                        console.info('Nope, not chrome or an extension');
                        reject();
                    }
                    chrome.permissions.request({
                        permissions: [permission]
                    }, function(granted) {
                        console.info(granted ? 'Permission ' + permission + ' granted.' : 'Permission ' + permission + ' denied.');
                        return (granted) ? resolve() : reject();
                    });
                });
            },
            revokePermission: function(permission) {
                return $q(function(resolve, reject) {
                    console.info('Revoke permission', permission);

                    if (!service.isSupported()) {
                        console.info('Nope, not chrome or an extension');
                        reject();
                    }
                    chrome.permissions.request({
                        permissions: [permission]
                    }, function(result) {
                        console.info(result ? 'Permission ' + permission + ' revoked.' : 'Permission ' + permission + ' not revoked.');
                        return (result) ? resolve() : reject();
                    });
                });
            }
        };

        return service;
    }
])

/**
 * The Settings Service stores user preferences and provides defaults.
 * Storage is in localStorage. values get serialized on save and deserialized on initialization.
 *
 * Shorthands to the get and set functions are provided in $rootScope by the getSetting and setSetting functions
 */
.factory('SettingsService', ["$injector", "$rootScope", "ChromePermissions", "availableLanguageKeys", "customLanguageKeyMappings",
    function($injector, $rootScope, ChromePermissions, availableLanguageKeys, customLanguageKeyMappings) {
        var service = {
            settings: {},
            defaults: {
                'KickAssTorrents.mirror': 'https://kat.cr',
                'ThePirateBay.mirror': 'https://thepiratebay.se',
                'application.language': null,
                'application.locale': 'en_us',
                'autobackup.period': 'monthly',
                'autodownload.minSeeders': 50,
                'autodownload.period': 1,
                'background-rotator.opacity': '0.4',
                'calendar.mode': 'date',
                'calendar.show-downloaded': true,
                'calendar.show-episode-numbers': false,
                'calendar.show-specials': true,
                'calendar.startSunday': true,
                'client.determinedlocale': null,
                'deluge.password': 'deluge',
                'deluge.port': 8112,
                'deluge.server': 'http://localhost',
                'deluge.use_auth': false,
                'download.ratings': true,
                'kc.always': false,
                'lastSync': -1,
                'library.seriesgrid': true,
                'library.smallposters': true,
                'main.viewmode': 'calendar', // todo || calendar
                'qbittorrent.password': 'admin',
                'qbittorrent.port': 8080,
                'qbittorrent.server': 'http://localhost',
                'qbittorrent.use_auth': true,
                'qbittorrent.username': 'admin',
                'qbittorrent32plus.password': 'admin',
                'qbittorrent32plus.port': 8080,
                'qbittorrent32plus.server': 'http://localhost',
                'qbittorrent32plus.use_auth': true,
                'qbittorrent32plus.username': 'admin',
                'series.displaymode': 'poster',
                'series.not-watched-eps-btn': false,
                'storage.sync': false, // off by default so that permissions must be requested
                'subtitles.languages': ['eng'],
                'sync.progress': true,
                'tixati.password': 'admin',
                'tixati.port': 8888,
                'tixati.server': 'http://localhost',
                'tixati.use_auth': true,
                'tixati.username': 'admin',
                'topSites.enabled': true,
                'topSites.mode': 'onhover',
                'torrentDialog.sortMenu.enabled': false,
                'torrenting.autodownload': false,
                'torrenting.autostop': true,
                'torrenting.autostop_all': false,
                'torrenting.client': 'uTorrent',
                'torrenting.directory': true,
                'torrenting.enabled': true,
                'torrenting.global_exclude': '',
                'torrenting.global_exclude_enabled': false,
                'torrenting.global_include': '',
                'torrenting.global_include_enabled': false,
                'torrenting.global_include_any': true,
                'torrenting.global_size_max': null,
                'torrenting.global_size_max_enabled': false,
                'torrenting.global_size_min': null,
                'torrenting.global_size_min_enabled': false,
                'torrenting.launch_via_chromium': false,
                'torrenting.progress': true,
                'torrenting.searchprovider': 'KickAss',
                'torrenting.searchquality': '',
                'torrenting.streaming': true,
                'trakt-update.period': 12,
                'trakttv.passwordHash': null,
                'trakttv.sync': false,
                'trakttv.username': null,
                'transmission.key': '/transmission/rpc',
                'transmission.password': 'admin',
                'transmission.port': 9091,
                'transmission.server': 'http://localhost',
                'transmission.use_auth': true,
                'transmission.username': 'admin',
                'utorrentwebui.password': '',
                'utorrentwebui.port': 8080,
                'utorrentwebui.server': 'http://localhost',
                'utorrentwebui.use_auth': true,
                'utorrentwebui.username': 'admin',
                'vuze.password': '',
                'vuze.port': 9091,
                'vuze.server': 'http://localhost',
                'vuze.use_auth': true,
                'vuze.username': 'vuze'
            },
            /**
             * Read a setting key and return either the stored value or the default
             * @param  string key to read
             * @return mixed value value of the setting
             */
            get: function(key) {
                return ((key in service.settings) ? service.settings[key] : (key in service.defaults) ? service.defaults[key] : false);
            },
            /**
             * Store a value in the settings object and persist the changes automatically.
             * @param string key key to store
             * @param mixed value to store
             */
            set: function(key, value) {
                service.settings[key] = value;
                if (key == 'calendar.startSunday') {
                    $injector.get('datePickerConfig').startSunday = value;
                }
                if (key == 'download.ratings') {
                    $injector.get('FavoritesService').downloadRatings = value;
                }
                service.persist();
            },
            /**
             * Serialize the data and persist it in localStorage
             */
            persist: function() {
                localStorage.setItem('userPreferences', angular.toJson(service.settings, true));
            },
            /**
             * DeSerialise data from localStorage (or if not found then load defaults) and store it in service.settings
             */
            restore: function() {
                if (!localStorage.getItem('userPreferences')) {
                    service.defaults['topSites.enabled'] = ('chrome' in window && 'topSites' in (window.chrome));
                    service.settings = service.defaults;
                } else {
                    service.settings = angular.fromJson(localStorage.getItem('userPreferences'));
                }
            },
            /*
             * Change the UI language and locale to use for translations tmhDynamicLocale
             */
            changeLanguage: function(langKey, locale) {
                console.warn("SettingsService.changeLanguage", langKey, locale);
                langKey = angular.lowercase(langKey) || 'en_us';
                var locale = langKey;

                if (availableLanguageKeys.indexOf(langKey) === -1 && Object.keys(customLanguageKeyMappings).indexOf(langKey) === -1 && customLanguageKeyMappings.indexOf(langKey) === -1) {
                    var matched = false;

                    if (langKey.indexOf('_') === -1) {
                        for (var key in customLanguageKeyMappings) {
                            console.debug(key, langKey, key.indexOf(langKey));
                            if (key.indexOf(langKey) > -1) {
                                langKey = key;
                                matched = true;
                                break;
                            }
                        }
                    }
                    if (!matched) {
                        langKey = locale = 'en_us';
                    }
                }

                service.set('application.language', langKey);
                service.set('application.locale', locale);
                $injector.get('tmhDynamicLocale').set(locale); // the SettingsService is also required in the background page and we don't need $translate there
                $injector.get('$translate').use(langKey, locale); // get these via the injector so that we don't have to use these dependencies hardcoded.
                return langKey;
            }
        };
        service.restore();
        return service;
    }
])

/**
 * rootScope shorthand helper functions.
 */
.run(["$rootScope", "SettingsService", function($rootScope, SettingsService) {

    $rootScope.isStandalone = (navigator.userAgent.toLowerCase().indexOf('standalone') > -1);
    $rootScope.isMac = (navigator.platform.toLowerCase().indexOf('mac') !== -1);

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

}]);