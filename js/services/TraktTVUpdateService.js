/** 
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
DuckieTV.factory('TraktTVUpdateService', ["$q", "TraktTVv2", "FavoritesService",
    function($q, TraktTVv2, FavoritesService) {

        function getDateString(date) {
            if (!date || isNaN(date.getTime())) {
                date = new Date();
            }
            return date.toISOString().split('T')[0];
        }

        var service = {
            /**
             * Update shows in favorites list
             * Fetches all updated shows from trakt.tv since date of passed timestamp, checks if local series were updated
             * before that, and updates those.
             * @param Date from fetch all updates from Trakt.TV since this date (limited to 10.000)
             * @return promise updated items
             */
            update: function(from) {

                return TraktTVv2.updated(getDateString(from)).then(function(results) {
                    var toUpdate = results.filter(function(res) {
                        if (!res || !res.tvdb_id) return false;
                        return FavoritesService.favorites.filter(function(favorite) {
                            return favorite.TVDB_ID == res.tvdb_id && (favorite.lastupdated == null || new Date(favorite.lastupdated) < new Date(res.remote_updated));
                        }).length > 0;
                    });
                    return $q.all(
                        toUpdate.map(function(serie) {
                            return TraktTVv2.serie(serie.slug_id).then(FavoritesService.addFavorite);
                        })
                    );
                });
            }
        };

        var updateFunc = function() {
            var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')));
            var localDate = new Date();
            if (getDateString(lastUpdated) != getDateString(localDate)) {
                service.update(lastUpdated).then(function(result) {
                    console.info('TraktTV update check completed. ' + result.length + ' shows updated since ' + lastUpdated);
                    if (result.length > 0) {
                        localStorage.setItem('trakttv.lastupdated', localDate.getTime());
                    };
                });
            } else {
                console.info("Not performing trakttv update check. already done today.");
            };
            setTimeout(updateFunc, 60 * 60 * 12 * 1000); // schedule update check in 12 hours for long running apps.
        };

        setTimeout(updateFunc, 8000);

        return service;
    }
]);