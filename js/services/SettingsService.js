/**
 * Wrapper from accessing and requesting chrome permissions
 */
DuckieTV.factory('ChromePermissions', ["$q",
    function($q) {
        var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
            isExtension = (('chrome' in window) && ('permissions' in chrome));

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
                'ThePirateBay.mirror': 'https://thepiratebay.org',
                'application.language': null,
                'application.locale': 'en_us',
                'aria2.port': 6800,
                'aria2.server': 'http://localhost',
                'aria2.token': '',
                'autobackup.period': 'monthly',
                'autodownload.delay': 15,
                'autodownload.multiSE': {
                    "ThePirateBay": true,
                    "1337x": true,
                    "IsoHunt": true,
                    "KATcr": true,
                    "Nyaa": true,
                    "RarBG": true,
                    "ShowRSS": true,
                    "TorrentDownloads": true,
                    "TorrentZ2": true,
                    "Zooqle": true
                },
                'autodownload.multiSE.enabled': false,
                'autodownload.period': 1,
                'background-rotator.opacity': '0.4',
                'biglybt.password': '',
                'biglybt.path': '/transmission/rpc',
                'biglybt.port': 9091,
                'biglybt.progressX100': true,
                'biglybt.server': 'http://localhost',
                'biglybt.use_auth': true,
                'biglybt.username': 'biglybt',
                'calendar.mode': 'date',
                'calendar.show-downloaded': true,
                'calendar.show-episode-numbers': false,
                'calendar.show-specials': true,
                'calendar.startSunday': true,
                'client.determinedlocale': null,
                'deluge.password': 'deluge',
                'deluge.port': 8112,
                'deluge.server': 'http://localhost',
                'deluge.use_auth': true,
                'download.ratings': true,
                'episode.watched-downloaded.pairing': true,
                'font.bebas.enabled': true,
                'kc.always': false,
                'ktorrent.password': 'ktorrent',
                'ktorrent.port': 8080,
                'ktorrent.server': 'http://localhost',
                'ktorrent.use_auth': true,
                'ktorrent.username': 'ktorrent',
                'lastSync': -1,
                'library.order.by': 'getSortName()',
                'library.order.reverseList': [true, false, true, true],
                'library.seriesgrid': true,
                'library.smallposters': true,
                'main.viewmode': 'calendar', // todo || calendar
                'notifications.enabled': true, // chrome notifications for download started/finished
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
                'rtorrent.path': '/RPC2',
                'rtorrent.port': 80,
                'rtorrent.server': 'http://localhost',
                'rtorrent.use_auth': false,
                'series.displaymode': 'poster',
                'series.not-watched-eps-btn': false,
                'storage.sync': false, // off by default so that permissions must be requested
                'subtitles.languages': ['eng'],
                'sync.progress': true,
                'synology.enabled': false,
                'synology.ip': '192.168.x.x',
                'synology.password': 'password',
                'synology.playback_devices': {},
                'synology.port': 5000,
                'synology.protocol': 'http',
                'synology.username': 'admin',
                'tixati.password': 'admin',
                'tixati.port': 8888,
                'tixati.server': 'http://localhost',
                'tixati.use_auth': true,
                'tixati.username': 'admin',
                'topSites.enabled': true,
                'topSites.mode': 'onhover',
                'torrentDialog.2.activeSE': {
                    "ThePirateBay": true,
                    "1337x": true,
                    "IsoHunt": true,
                    "KATcr": true,
                    "Nyaa": true,
                    "RarBG": true,
                    "ShowRSS": true,
                    "TorrentDownloads": true,
                    "TorrentZ2": true,
                    "Zooqle": true
                },
                'torrentDialog.2.enabled': false,
                'torrentDialog.2.sortBy': '+engine',
                'torrentDialog.showAdvanced.enabled': true,
                'torrenting.autodownload': false,
                'torrenting.autostop': true,
                'torrenting.autostop_all': false,
                'torrenting.client': 'uTorrent',
                'torrenting.directory': true,
                'torrenting.enabled': true,
                'torrenting.global_size_max': null,
                'torrenting.global_size_max_enabled': true,
                'torrenting.global_size_min': null,
                'torrenting.global_size_min_enabled': true,
                'torrenting.ignore_keywords': '',
                'torrenting.ignore_keywords_enabled': true,
                'torrenting.label': false,
                'torrenting.launch_via_chromium': false,
                'torrenting.min_seeders': 50,
                'torrenting.min_seeders_enabled': false,
                'torrenting.progress': true,
                'torrenting.require_keywords': '',
                'torrenting.require_keywords_enabled': true,
                'torrenting.require_keywords_mode_or': true,
                'torrenting.searchprovider': 'ThePirateBay',
                'torrenting.searchquality': '',
                'torrenting.searchqualitylist': ["480p", "HDTV", "720p", "1080p", "2160p"],
                'torrenting.streaming': true,
                'trakt-update.period': 12,
                'trakttv.passwordHash': null,
                'trakttv.sync': false,
                'trakttv.username': null,
                'transmission.password': 'admin',
                'transmission.path': '/transmission/rpc',
                'transmission.port': 9091,
                'transmission.progressX100': true,
                'transmission.server': 'http://localhost',
                'transmission.use_auth': true,
                'transmission.username': 'admin',
                'ttorrent.password': '',
                'ttorrent.port': 1080,
                'ttorrent.server': 'http://localhost',
                'ttorrent.use_auth': true,
                'ttorrent.username': 'admin',
                'utorrentwebui.password': '',
                'utorrentwebui.port': 8080,
                'utorrentwebui.server': 'http://localhost',
                'utorrentwebui.use_auth': true,
                'utorrentwebui.username': 'admin',
                'vuze.password': '',
                'vuze.path': '/transmission/rpc',
                'vuze.port': 9091,
                'vuze.progressX100': true,
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
                    service.defaults['topSites.enabled'] = (!service.isStandalone() && 'chrome' in window && 'topSites' in (window.chrome));
                    service.settings = service.defaults;
                } else {
                    service.settings = angular.fromJson(localStorage.getItem('userPreferences'));
                    if (service.isStandalone()) {
                        service.settings['topSites.enabled'] = false;
                    }
                }
            },
            /*
             * Change the UI language and locale to use for translations tmhDynamicLocale
             */
            changeLanguage: function(langKey, locale) {
                console.info("SettingsService.changeLanguage", langKey, locale);
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
            },
            /**
             * is DuckieTV running Standalone?
             * note: Since NWJS 0.13.x, we can just look for the nw object in window. 
             *          The legacy way of loading NW.js APIs using require('nw.gui') is supported but no longer necessary. It returns the same nw object.
             */
            isStandalone: function() {
                return ('nw' in window);
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

    $rootScope.isStandalone = (SettingsService.isStandalone());
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
