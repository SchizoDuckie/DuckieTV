angular.module('DuckieTV.providers.migrations', ['ui.bootstrap.modal', 'DuckieTV.providers.settings', 'DuckieTV.providers.favorites', 'DuckieTV.providers.trakttvv2'])
    
.factory('MigrationService', ["$modal", "$q", "$rootScope", "SettingsService", "FavoritesService", "TraktTVv2", function($modal, $q, $rootScope, SettingsService, FavoritesService, TraktTVv2) {

    var service = {

        check: function() {
            if (!localStorage.getItem('0.9migration')) {
                setTimeout(function() {
                    CRUD.EntityManager.getAdapter().db.execute('update series set lastupdated = null').then(function() {
                        return CRUD.EntityManager.getAdapter().db.execute('update series set lastupdated = null');
                    }).then(function() {
                        return CRUD.EntityManager.getAdapter().db.execute('drop table if exists EventSchedule');
                    }).then(function() {
                        localStorage.setItem('0.9migration', new Date());
                        return FavoritesService.refresh();
                    });
                }, 5000);
            }

            // until the TraktTV api is stabilized, we perform this check on every startup until we find no more series with a lastUpdated of null
            if (!localStorage.getItem('0.9updateallshows')) {
                setTimeout(function() {
                    // Fire up updates for everything
                    console.log("Starting to check if every serie has had at least one update");
                    $q.all(FavoritesService.favorites.map(function(serie) {
                        if (serie.lastupdated !== null) return;
                        console.log("Update!", serie.name);
                        TraktTVv2.resolveTVDBID(serie.TVDB_ID).then(function(searchResult) {
                            return TraktTVv2.serie(searchResult.slug_id);
                        }).then(function(serie) {
                            return FavoritesService.addFavorite(serie).then(function() {
                                return true;
                            });
                        });
                    })).then(function() {
                        var notUpdated = FavoritesService.favorites.filter(function(serie) {
                            return serie.lastupdated === null;
                        });
                        if (notUpdated.length === 0) {
                            localStorage.setItem('0.9updateallshows', true);
                        }
                    });
                }, 10000);
            }

            // Fix shows that have no watched but do have watchedAt
            if (!localStorage.getItem('0.91migration')) {
                setTimeout(function() {
                    console.info("Executing the 0.91 migration to fix watched episodes");
                    CRUD.EntityManager.getAdapter().db.execute('update episodes set watched = 1 where watchedAt is not null')
                        .then(function() {
                            console.log("0.91 migration done.");
                            localStorage.setItem('0.91migration', new Date());
                            return FavoritesService.refresh();
                        });
                }, 7000);
            }
        }
    };

    service.check();
    return service;
}]);