/** 
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
DuckieTV.factory('TraktTVUpdateService', ["$q", "TraktTVv2", "FavoritesService",
    function($q, TraktTVv2, FavoritesService) {



        var service = {
            /**
             * Update shows in favorites list
             * Fetches all updated shows from trakt.tv since date of passed timestamp, checks if local series were updated
             * before that, and updates those.
             * @param Date from fetch all updates from Trakt.TV since this date (limited to 10.000)
             * @return promise updated items
             */
            getDateString: function(date) {
                if (!date || isNaN(date.getTime())) {
                    date = new Date();
                }
                return date.toISOString().split('T')[0];
            },
            update: function(from) {

                return TraktTVv2.updated(service.getDateString(from)).then(function(results) {
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
            },
            /**
             * Save Trakt.TV's trending list to localstorage once a week
             */
            updateCachedTrending: function() {
                return TraktTVv2.trending(true).then(function(result) {
                    localStorage.setItem('trakttv.trending.cache', JSON.stringify(result.map(function(serie) {
                        delete serie.images;
                        delete serie.ids;
                        delete serie.available_translations;
                        delete serie.fanart;
                        delete serie.banner;
                        delete serie.tmdb_id;
                        delete serie.trakt_id;
                        return serie;
                    })));
                    return true;
                });
            }
        };

        return service;
    }
])

.run(function(TraktTVUpdateService) {

    var updateFunc = function() {
        var localDate = new Date();
        if (!localStorage.getItem('trakttv.lastupdated')) {
            localStorage.setItem('trakttv.lastupdated', localDate.getTime());
        }
        var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')));
        if (TraktTVUpdateService.getDateString(lastUpdated) != TraktTVUpdateService.getDateString(localDate)) {
            TraktTVUpdateService.update(lastUpdated).then(function(result) {
                console.info('TraktTV update check completed. ' + result.length + ' shows updated since ' + lastUpdated);
                localStorage.setItem('trakttv.lastupdated', localDate.getTime()); // undid the if here. check was happening on every refresh!
            });
        } else {
            console.info("Not performing trakttv update check. already done today.");
        };

        if (!localStorage.getItem('trakttv.lastupdated.trending')) {
            localStorage.setItem('trakttv.lastupdated.trending', 0);
        }
        if ((parseInt(localStorage.getItem('trakttv.lastupdated.trending')) + (1000 * 60 * 60 * 24 * 7)) /* 1 week */ < new Date().getTime()) {
            TraktTVUpdateService.updateCachedTrending().then(function() {
                console.info('TraktTV trending update completed. last updated:' + new Date(parseInt(localStorage.getItem('trakttv.lastupdated.trending'))).toString());
                localStorage.setItem('trakttv.lastupdated.trending', new Date().getTime());
            });
        } else {
            console.info("Not performing trakttv trending update check. last done " + new Date(parseInt(localStorage.getItem('trakttv.lastupdated.trending'))).toString());
        };
        setTimeout(updateFunc, 60 * 60 * 12 * 1000); // schedule update check in 12 hours for long running apps.
    };

    setTimeout(updateFunc, 8000);
})


// todo: create generic update service that we can extend
// so that it can also fetch xem updates
// and trakt updates