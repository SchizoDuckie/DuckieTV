/**
 * Trakt TV V2 API interfacing.
 * Throughout the app the API from Trakt.TV is used to fetch content about shows and optionally the user's data
 *
 * For API docs: check here: http://docs.trakt.apiary.io/#
 */
DuckieTV.factory('TraktTVUpdateService', ["$q", "TraktTVv2", "FavoritesService", "FanartService",
    function($q, TraktTVv2, FavoritesService, FanartService) {



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
                            return favorite.TVDB_ID == res.tvdb_id && (favorite.lastupdated === null || new Date(favorite.lastupdated) < new Date(res.remote_updated));
                        }).length > 0;
                    });
                    return $q.all(
                        toUpdate.map(function(serie) {
                            return TraktTVv2.serie(serie.trakt_id).then(function(serie) {
                                return FavoritesService.addFavorite(serie, undefined, undefined, true);
                            });
                        })
                    );
                });
            },
            /**
             * Save Trakt.TV's trending list to localstorage once a week
             * Fetches images for any new shows added to the trending list
             * Existing shows with posters use their existing poster urls
             */
            updateCachedTrending: function() {
                var oldCache = localStorage.getItem('trakttv.trending.cache');
                oldCache = oldCache ? JSON.parse(oldCache) : [];
                var oldCacheIds = oldCache ? oldCache.map(function(a) {
                    return a.tvdb_id;
                }) : [];
                return TraktTVv2.trending(true).then(function(result) {
                    return Promise.all(result.map(function(serie) {
                        return new Promise(function(resolve) {
                            // Delete bunch of stuff we don't need to save space
                            delete serie.ids;
                            delete serie.available_translations;
                            delete serie.title;
                            delete serie.tvrage_id;
                            delete serie.imdb_id;
                            delete serie.updated_at;
                            delete serie.aired_episodes;
                            delete serie.homepage;
                            delete serie.slug_id;
                            var originalSerie = oldCache[oldCacheIds.indexOf(serie.tvdb_id)];
                            if (originalSerie && originalSerie.poster) {
                                serie.poster = originalSerie.poster;
                                return resolve(serie);
                            }
                            FanartService.get(serie.tvdb_id).then(function(fanart) {
                                serie.poster = FanartService.getTrendingPoster(fanart);
                                return resolve(serie);
                            });
                        });
                    })).then(function(shows) {
                        localStorage.setItem('trakttv.trending.cache', JSON.stringify(shows));
                        return true;
                    });
                });
            }
        };

        return service;
    }
])

.run(["TraktTVUpdateService", "SettingsService", function(TraktTVUpdateService, SettingsService) {

    var updateFunc = function() {
        var localDateTime = new Date().getTime();
        var tuPeriod = parseInt(SettingsService.get('trakt-update.period')); // TraktTV Update period in hours.
        if (!localStorage.getItem('trakttv.lastupdated')) {
            localStorage.setItem('trakttv.lastupdated', localDateTime);
        }
        var lastUpdated = new Date(parseInt(localStorage.getItem('trakttv.lastupdated')));
        if ((parseInt(localStorage.getItem('trakttv.lastupdated')) + (1000 * 60 * 60 * tuPeriod)) /* hours */  <= localDateTime) {
            TraktTVUpdateService.update(lastUpdated).then(function(result) {
                console.info('TraktTV update check completed. ' + result.length + ' shows updated since ' + lastUpdated);
                localStorage.setItem('trakttv.lastupdated', localDateTime);
            });
        } else {
            console.info("Not performing TraktTV update check. Already done within the last %s hour(s).", tuPeriod);
        }

        if (!localStorage.getItem('trakttv.lastupdated.trending')) {
            localStorage.setItem('trakttv.lastupdated.trending', 0);
        }
        if ((parseInt(localStorage.getItem('trakttv.lastupdated.trending')) + (1000 * 60 * 60 * 24 * 7)) /* 1 week */ < new Date().getTime()) {
            TraktTVUpdateService.updateCachedTrending().then(function() {
                console.info('TraktTV trending update completed. last updated:' + new Date(parseInt(localStorage.getItem('trakttv.lastupdated.trending'))).toString());
                localStorage.setItem('trakttv.lastupdated.trending', new Date().getTime());
            });
        } else {
            console.info("Not performing TraktTV trending update check. Last done " + new Date(parseInt(localStorage.getItem('trakttv.lastupdated.trending'))).toString());
        }
        setTimeout(updateFunc, 1000 * 60 * 60 * tuPeriod); // schedule update check every tuPeriod hour(s) for long running apps.
    };

    setTimeout(updateFunc, 8000);
}]);

/**
 * todo: create generic update service that we can extend  so that it can also fetch xem updates
 * and trakt updates
 */
