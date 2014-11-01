angular.module('DuckieTV.providers.trakttvstoragesync', ['DuckieTV.providers.settings', 'DuckieTV.providers.storagesync'])

/** 
 * Trakt TV Sync interface.
 *
 * Reads and writes from and to trakt.tv
 */
.factory('TraktTVStorageSyncTarget', function(StorageSyncService, SettingsService, TraktTV) {
    var service = {
        name: 'TraktTV Sync Target',
        lastSync: 'never',
        status: 'idle',

        isEnabled: function() {
            return SettingsService.get('TraktTV.Sync')
        },

        enable: function() {
            SettingsService.set('TraktTV.Sync', true);
        },

        disable: function() {
            SettingsService.set('TraktTV.Sync', false);
        },

        read: function() {
            return TraktTV.enableBatchMode().getUserWatched(SettingsService.get('trakttv.username')).then(function(series) {
                return series.map(function(el) {
                    return el.tvdb_id;
                });
            });
        },

        write: function(series) {

        }

    };

    console.log("TraktTV storage sync target initialized!");

    return service;
});


window.addEventListener('DOMContentLoaded', function() {
    angular.element(document.body).injector().get('StorageSyncService').registerTarget('TraktTVStorageSyncTarget');
});