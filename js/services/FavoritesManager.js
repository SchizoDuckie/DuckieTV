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
        var traktId = serie.trakt_id
        var operation = FavoritesService.getOperation(traktId)
        if (operation.state === 'adding') return operation.promise || $q.when(false)
        if (!refresh && FavoritesService.isAdded(traktId)) {
          FavoritesService.added(traktId)
          return $q.when(true)
        }

        var id = traktId || serie.imdb_id || serie.slug_id
        var promise = $q.when().then(function() {
          return TraktTVv2.serie(id)
        }).then(function(resolvedSerie) {
          return FavoritesService.addFavorite(resolvedSerie, undefined, true, refresh)
        }).then(function() {
          $rootScope.$broadcast('storage:update')
          FavoritesService.added(traktId)
          return true
        }).catch(function(err) {
          console.error('Error adding show!', err)
          FavoritesService.addError(traktId, err)
          return false
        })
        FavoritesService.adding(traktId, promise)
        return promise
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
