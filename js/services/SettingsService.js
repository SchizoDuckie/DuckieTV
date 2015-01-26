angular.module('DuckieTV.providers.settings', [])

/**
 * Wrapper from accessing and requesting chrome permissions
 */
.factory('ChromePermissions', function($q) {
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
                    (supported && 'sync' in chrome.storage) ? resolve() : reject();
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
                    (granted) ? resolve() : reject();
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
                    (result) ? resolve() : reject();
                });
            });

        }
    };

    return service;



})
/**
 * The Settings Service stores user preferences and provides defaults.
 * Storage is in localStorage. values get serialized on save and deserialized on initialization.
 *
 * Shorthands to the get and set functions are provided in $rootScope by the getSetting and setSetting functions
 */
.factory('SettingsService', function($injector, $rootScope, ChromePermissions) {
    var service = {
        settings: {},
        defaults: {
            'application.language': null,
            'application.locale': 'en_us',
            'background-rotator.opacity': '0.4',
            'calendar.mode': 'date',
            'calendar.show-specials': true,
            'calendar.startSunday': true,
            'client.determinedlocale': null,
            'kickasstorrents.mirror': 'https://kickass.so',
            'lastSync': -1,
            'series.displaymode': 'poster',
            'storage.sync': false, // off by default so that permissions must be requested
            'sync.progress': true,
            'topSites.enabled': true,
            'topSites.mode': 'onhover',
            'torrenting.autodownload': false,
            'torrenting.autostop': true,
            'torrenting.directory': true,
            'torrenting.enabled': true,
            'torrenting.progress': true,
            'torrenting.searchprovider': 'KickassTorrents',
            'torrenting.searchquality': '',
            'torrenting.streaming': true,
            'trakttv.passwordHash': null,
            'trakttv.sync': false,
            'trakttv.username': null,
            'torrenting.genericClients': {
                /* R.I.P. TPB
                'ThePirateBay': {
                    mirror: 'https://thepiratebay.cr',
                mirrorResolver: 'MirrorResolver',
                    endpoints: {
                        search: '/search/%s/0/7/0',
                        details: '/torrent/%s'
                    },
                    selectors: {
                        resultContainer: '#searchResult tbody tr',
                        releasename: ['td:nth-child(2) > div', 'innerText',
                            function(text) {
                                return text.trim();
                            }
                        ],
                        magneturl: ['td:nth-child(2) > a', 'href'],
                        size: ['td:nth-child(2) .detDesc', 'innerText',
                            function(innerText) {
                                return innerText.split(', ')[1].split(' ')[1];
                            }
                        ],
                        seeders: ['td:nth-child(3)', 'innerHTML'],
                        leechers: ['td:nth-child(4)', 'innerHTML'],
                        detailUrl: ['a.detLink', 'href'],
                    }
                }, */
                'KickAssTorrents': {
                    mirror: 'https://kickass.so',
                    mirrorResolver: null, //'KickassMirrorResolver'
                    endpoints: {
                        search: '/usearch/%s/?field=seeders&sorder=desc',
                        details: '/torrent/%s'
                    },
                    selectors: {
                        resultContainer: 'table.data tr[id^=torrent]',
                        releasename: ['div.torrentname a.cellMainLink', 'innerText'],
                        magneturl: ['a[title="Torrent magnet link"]', 'href'],
                        size: ['td:nth-child(2)', 'innerText'],
                        seeders: ['td:nth-child(5)', 'innerHTML'],
                        leechers: ['td:nth-child(6)', 'innerHTML'],
                        detailUrl: ['div.torrentname a.cellMainLink', 'href']
                    }
                },
                'Torrentz.eu': {
                    mirror: 'https://torrentz.eu',
                    mirrorResolver: null,
                    endpoints: {
                        search: '/search?f=%s',
                        details: '/%s',
                    },
                    selectors: {
                        resultContainer: 'div.results dl',
                        releasename: ['dt a', 'innerText'],
                        magneturl: ['dt a', 'href',
                            function(a) {
                                return 'magnet:?xt=urn:sha1:' + a.substring(1);
                            }
                        ],
                        size: ['dd span.s', 'innerText'],
                        seeders: ['dd span.u', 'innerText'],
                        leechers: ['dd span.d', 'innerText'],
                        detailUrl: ['dt a', 'href']
                    }
                },
                'OldPirateBay': {
                    mirror: 'https://oldpiratebay.org',
                    mirrorResolver: null,
                    endpoints: {
                        search: '/search.php?q=%s&Torrent_sort=seeders.desc',
                        details: '/%s',
                    },
                    selectors: {
                        resultContainer: 'table.table-torrents tbody tr',
                        releasename: ['td.title-row a span', 'innerText'],
                        magneturl: ['td.title-row a[title="MAGNET LINK"]', 'href'],
                        size: ['td.size-row', 'innerText'],
                        seeders: ['td.seeders-row', 'innerText'],
                        leechers: ['td.leechers-row', 'innerText'],
                        detailUrl: ['td.title-row > a', 'href']
                    }
                }
            }
        },

        /**
         * Read a setting key and return either the stored value or the default
         * @param  string key to read
         * @return mixed value value of the setting
         */
        get: function(key) {
            if (key == 'cast.supported') {
                return ('chrome' in window && 'cast' in chrome && 'Capability' in chrome.cast && 'VIDEO_OUT' in chrome.cast.Capability);
            }
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
            service.persist();
        },

        /**
         * Serialize the data and persist it in localStorage
         */
        persist: function() {
            localStorage.setItem('userPreferences', angular.toJson(service.settings, true));
        },

        /**
         * Fetch stored series from sqlite and store them in service.favorites
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
         * Todo: clean this up.
         */
        changeLanguage: function(langKey) {
            langKey = angular.lowercase(langKey) || 'en_us';
            var locale = langKey;
            switch (langKey) {
                case 'en_au':
                case 'en_ca':
                case 'en_gb':
                case 'en_nz':
                    langKey = 'en_uk';
                    break;
                case 'de':
                    langKey = 'de_de';
                    break;
                case 'en':
                    langKey = 'en_us';
                    break;
                case 'es':
                    langKey = 'es_es';
                    break;
                case 'fr':
                    langKey = 'fr_fr';
                    break;
                case 'it':
                    langKey = 'it_it';
                    break;
                case 'ja':
                    langKey = 'ja_jp';
                    break;
                case 'ko':
                    langKey = 'ko_kr';
                    break;
                case 'nl':
                    langKey = 'nl_nl';
                    break;
                case 'pt':
                case 'pt_br':
                    langKey = 'pt_pt';
                    break;
                case 'es_419':
                    langKey = 'es_es';
                    break;
                case 'ru':
                    langKey = 'ru_ru';
                    break;
                case 'sv':
                    langKey = 'sv_se';
                    break;
                case 'zh':
                    langKey = 'zh_cn';
                    break;
            }
            service.set('application.language', langKey);
            service.set('application.locale', locale);
            $injector.get('$translate').use(langKey); // get these via the injector so that we don't have to use these dependencies hardcoded.
            $injector.get('tmhDynamicLocale').set(locale); // the SettingsService is also required in the background page and we don't need $translate there
            //console.info("Active Language", langKey, "; Active Locale", locale);
        }
    };
    service.restore();
    return service;
});