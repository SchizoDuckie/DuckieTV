angular.module('DuckieTV.providers.settings', [])

/**
 * The Settings Service stores user preferences and provides defaults.
 * Storage is in localStorage. values get serialized on save and deserialized on initialization.
 *
 * Shorthands to the get and set functions are provided in $rootScope by the getSetting and setSetting functions
 */
.factory('SettingsService', function($injector) {
    var service = {
        settings: {},
        defaults: {
            'topSites.enabled': true,
            'torrenting.enabled': true,
            'torrenting.autodownload': false,
            'torrenting.searchprovider': 'ThePirateBay',
            'torrenting.searchquality': '',
            'torrenting.autostop': true,
            'torrenting.streaming': true,
            'torrenting.directory': true,
            'torrenting.progress': true,
            'thepiratebay.mirror': 'https://thepiratebay.se',
            'series.displaymode': 'poster',
            'calendar.startSunday': true,
            'storage.sync': true,
            'calendar.mode': 'date',
            'background-rotator.opacity': '0.4',
            'locale': 'en_us'
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
        }
    };
    service.restore();
    return service;
})