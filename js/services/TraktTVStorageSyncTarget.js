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
        statusMessage: '',
        series: [],
        nonRemote: [],
        nonLocal: [],

        isEnabled: function() {
            return SettingsService.get('TraktTV.Sync')
        },

        enable: function() {
            SettingsService.set('TraktTV.Sync', true);
        },

        disable: function() {
            SettingsService.set('TraktTV.Sync', false);
        },

        getSeriesList: function() {
            service.status = 'reading';
            return TraktTV.enableBatchMode().getUserWatched(SettingsService.get('trakttv.username')).then(function(series) {
                series = series.map(function(el) {
                    return parseInt(el.tvdb_id);
                });
                service.status = 'idle';
                return series;
            }, function(err) {
                service.status = 'read error';
                service.statusMessage = [err.status, err.statusText].join(' : ');
                return [];
            });
        },

        write: function(series) {

        }

    };

    console.log("TraktTV storage sync target initialized!");

    return service;
});


window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        angular.element(document.body).injector().get('StorageSyncService').registerTarget('TraktTVStorageSyncTarget');
    }, 500);
});