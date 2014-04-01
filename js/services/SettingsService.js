angular.module('DuckieTV.providers.settings', [])


.factory('SettingsService', function(StorageSyncService) {
    var service = {
        settings: {},
        defaults: {
            'topSites.enabled': true,
            'torrenting.enabled': true,
            'torrenting.searchprovider': 'ThePirateBay',
            'torrenting.searchbox': true,
            'torrenting.searchquality': '',
            'thepiratebay.mirror': 'https://thepiratebay.se',
            'series.displaymode': 'poster',
            'calendar.large': false,
            'storage.sync': true,
            'calendar.mode': 'date'
        },

        get: function(key) {
            return ((key in service.settings) ? service.settings[key] : (key in service.defaults) ? service.defaults[key] : false);
        },

        set: function(key, value) {
            service.settings[key] = value;
            service.persist();
        },

        persist: function() {
            localStorage.setItem('userPreferences', angular.toJson(service.settings, true));
        },

        /**
         * Fetch stored series from sqlite and store them in service.favorites
         * Notify anyone listening by broadcasting favorites:updated
         */
        restore: function() {
            if (!localStorage.getItem('userPreferences')) {
                service.defaults['topSites.enabled'] = ('topSites' in (window.chrome));
                service.settings = service.defaults;
            } else {
                service.settings = angular.fromJson(localStorage.getItem('userPreferences'));
            }
        }
    };
    service.restore();
    return service;
})