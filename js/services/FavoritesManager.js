/**
 * FavoritesManager
 * Has add / remove / refresh functions for trakt.tv shows
 * Deduplicates a lot of logic and duplicated dependency injections
 */
DuckieTV.factory("FavoritesManager", ["FavoritesService", "TraktTVv2", "$rootScope", "$filter", "dialogs", "$q", function(FavoritesService, TraktTVv2, $rootScope, $filter, dialogs, $q) {

    var service = {
        /**
         * Add a show to the database, show progress via FavoritesService.added / errors
         * @param object serie object from trakt
         * @param boolean refresh (optional)
         * @return Promise 
         */
        add: function(serie, refresh) {
            refresh = refresh || false;
            if (!FavoritesService.isAdding(serie.tvdb_id) && (refresh || !FavoritesService.isAdded(serie.tvdb_id))) {
                FavoritesService.adding(serie.tvdb_id);
                var id = serie.trakt_id || serie.imdb_id || serie.slug_id;
                return TraktTVv2.serie(id).then(function(serie) {
                    return FavoritesService.addFavorite(serie, undefined, undefined, refresh).then(function() {
                        $rootScope.$broadcast('storage:update');
                        FavoritesService.added(serie.tvdb_id);
                        return true;
                    });
                }, function(err) {
                    console.error("Error adding show!", err);
                    FavoritesService.added(serie.tvdb_id);
                    FavoritesService.addError(serie.tvdb_id, err);
                    return false;
                });
            } else {
                return $q.when(function() {
                    return true;
                });
            }
        },
        /**
         * Popup dialog to confirm removal and perform removal.
         */
        remove: function(serie) {
            var dlg = dialogs.confirm($filter('translate')('COMMON/serie-delete/hdr'),
                $filter('translate')('COMMON/serie-delete-question/desc') +
                serie.name +
                $filter('translate')('COMMON/serie-delete-question/desc2')
            );
            return dlg.result.then(function() {
                console.info("Removing serie '" + serie.name + "' from favorites!");
                return FavoritesService.remove(serie);
            }, function() {});
        },
        /**
         * Refresh a show by passing a TVDB_ID
         * Resolves the basic serie info from trakt and re-adds it, overriding the not-added check.
         */
        refresh: function(TVDB_ID) {
            return TraktTVv2.resolveTVDBID(TVDB_ID).then(function(serie) {
                return service.add(serie, true);
            });
        },

        isAdding: function(serie) {
            return FavoritesService.isAdding(serie);
        },

        getById: function(id) {
            return FavoritesService.getById(id);
        }

    };

    return service;

}]);