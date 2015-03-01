/** 
 * Trakt TV Sync interface.
 *
 * Reads and writes from and to trakt.tv
 */
DuckieTV.factory('TraktTVStorageSyncTarget', ["StorageSyncService", "SettingsService", "TraktTVv2",
    function(StorageSyncService, SettingsService, TraktTVv2) {
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
                return TraktTVv2.watched().then(function(series) {
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

        console.info("TraktTV storage sync target initialized!");
        return service;
    }
]).run(["StorageSyncService",
    function(StorageSyncService) {
        StorageSyncService.registerTarget('TraktTVStorageSyncTarget');
    }
])