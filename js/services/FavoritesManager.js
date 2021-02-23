/**
 * FavoritesManager
 * Has add / remove / refresh functions for trakt.tv shows
 * Deduplicates a lot of logic and duplicated dependency injections
 */
DuckieTV.factory('FavoritesManager', ['FavoritesService', 'TraktTVv2', '$rootScope', '$filter', 'dialogs', '$q',
  function(FavoritesService, TraktTVv2, $rootScope, $filter, dialogs, $q) {
    var service = {
      /**
       * Add a show to the database, show progress via FavoritesService.added / errors
       * @param object serie object from trakt
       * @param boolean refresh (optional)
       * @return Promise
       */
      add: function(serie, refresh) {
        refresh = refresh || false
        if (!FavoritesService.isAdding(serie.trakt_id) && (refresh || !FavoritesService.isAdded(serie.trakt_id))) {
          FavoritesService.adding(serie.trakt_id)
          var id = serie.trakt_id || serie.imdb_id || serie.slug_id
          return TraktTVv2.serie(id).then(function(serie) {
            return FavoritesService.addFavorite(serie, undefined, true, refresh).then(function() {
              $rootScope.$broadcast('storage:update')
              FavoritesService.added(serie.trakt_id)
              return true
            })
          }, function(err) {
            console.error('Error adding show!', err)
            FavoritesService.added(serie.trakt_id)
            FavoritesService.addError(serie.trakt_id, err)
            return false
          })
        } else {
          return $q.when(function() {
            return true
          })
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
        )

        return dlg.result.then(function() {
          console.info("Removing serie '" + serie.name + "' from favorites!")
          return FavoritesService.remove(serie)
        }, function() {})
      },
      /**
       * Refresh a show by passing a TRAKT_ID
       * Resolves the basic serie info from trakt and re-adds it, overriding the not-added check.
       */
      refresh: function(TRAKT_ID) {
        return TraktTVv2.resolveID(TRAKT_ID, true).then(function(serie) {
          return service.add(serie, true)
        })
      },

      isAdding: function(trakt_id) {
        return FavoritesService.isAdding(trakt_id)
      },

      getByTrakt_id: function(id) {
        return FavoritesService.getByTRAKT_ID(id)
      }

    }

    return service
  }])
