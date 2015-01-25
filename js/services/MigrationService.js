angular.module('DuckieTV.providers.migrations', ['ui.bootstrap.modal', 'DuckieTV.providers.favorites', 'DuckieTV.providers.trakttvv2'])
    .factory('MigrationService', function($modal, $q, $rootScope, FavoritesService, TraktTVv2) {

        var service = {

            check: function() {

                if (!localStorage.getItem('0.9migration')) {
                    CRUD.EntityManager.getAdapter().db.execute('drop table if exists EventSchedule');
                    CRUD.EntityManager.getAdapter().db.execute('update series set lastupdated = null').then(function() {
                        FavoritesService.refresh();
                    })


                    //localStorage.setItem('0.9migration', true);
                    $modal.open({
                        templateUrl: 'templates/upgrade.html',
                        windowClass: 'dialogs-default',
                        size: 'lg',
                    });

                    localStorage.setItem('0.9migration', new Date());

                }

                // until the TraktTV api is stabilized, we perform this check on every startup until we find no more series with a lastUpdated of null
                if (!localStorage.getItem('0.9updateallshows')) {
                    setTimeout(function() {
                        // fire up updates for everything
                        //
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


                    }, 3000);
                }
            }
        };

        service.check();
        return service;

    });