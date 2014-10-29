angular.module('DuckieTV.providers.settings', [])

/**
 * The Settings Service stores user preferences and provides defaults.
 * Storage is in localStorage. values get serialized on save and deserialized on initialization.
 *
 * Shorthands to the get and set functions are provided in $rootScope by the getSetting and setSetting functions
 */
.factory('SettingsService', function($injector, $rootScope) {
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
            'kickasstorrents.mirror': 'https://kickass.to',
            'lastSync': -1,
            'series.displaymode': 'poster',
            'storage.sync': false,
            'sync.progress': true,
            'thepiratebay.mirror': 'https://thepiratebay.se',
            'proxy.allowUnsafe': false,
            'topSites.enabled': true,
            'topSites.mode': 'onhover',
            'torrenting.autodownload': false,
            'torrenting.autostop': true,
            'torrenting.directory': true,
            'torrenting.enabled': true,
            'torrenting.progress': true,
            'torrenting.searchprovider': 'ThePirateBay',
            'torrenting.searchquality': '',
            'torrenting.streaming': true,
            'trakttv.passwordHash': null,
            'trakttv.sync': false,
            'trakttv.username': null
        },

        /**
         * Read a setting key and return either the stored value or the default
         * @param  string key to read
         * @return mixed value value of the setting
         */
        get: function(key) {
            if (key == 'cast.supported') {
                return ('chrome' in window && 'cast' in chrome && 'Capability' in chrome.cast && 'VIDEO_OUT' in chrome.cast.Capability)
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
         * Notify anyone listening by broadcasting favorites:updated
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
                case 'es_419':
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
            console.info("Active Language", langKey, "; Active Locale", locale);
        }
    };
    service.restore();
    return service;
});