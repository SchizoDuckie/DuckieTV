DuckieTV
/**
 * Migrations that run when updating DuckieTV version.
 */
    .run(['FavoritesService', '$rootScope', 'SettingsService', 'TorrentHashListService', 'TraktTVv2',
    function(FavoritesService, $rootScope, SettingsService, TorrentHashListService, TraktTVv2) {

        // delete watchlist

        if (!localStorage.getItem('1.1.6deleteWatchList')) {
            console.info("Executing 1.1.6deleteWatchList");
            CRUD.executeQuery('drop table WatchList');
            CRUD.executeQuery('drop table WatchListObject');
            localStorage.setItem('1.1.6deleteWatchList', new Date());
            console.info("1.1.6deleteWatchList done!");
        }


    }
])