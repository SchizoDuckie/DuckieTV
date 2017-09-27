DuckieTV
/**
 * Migrations that run when updating DuckieTV version.
 */
    .run(['FavoritesService', '$rootScope', 'SettingsService', 'TorrentHashListService', 'TraktTVv2',
    function(FavoritesService, $rootScope, SettingsService, TorrentHashListService, TraktTVv2) {

        // update deluge auth

        if (!localStorage.getItem('1.1.5updateDelugeAuth')) {
            console.info("Executing 1.1.5updateDelugeAuth to set deluge.use_auth to true");
            SettingsService.set('deluge.use_auth', true);
            localStorage.setItem('1.1.5updateDelugeAuth', new Date());
            console.info("1.1.5updateDelugeAuth done!");
        }

        // copy autodownload.minSeeders to torrenting.min_seeders if previously set

        if (!localStorage.getItem('1.1.5updateTorrenting.min_seeders')) {
            console.info("Executing 1.1.5updateTorrenting.min_seeders to clone autodownload.minSeeders to torrenting.min_seeders");
            if (SettingsService.get('autodownload.minSeeders')) {
                SettingsService.set('torrenting.min_seeders', SettingsService.get('autodownload.minSeeders'));
            }
            localStorage.setItem('1.1.5updateTorrenting.min_seeders', new Date());
            console.info("1.1.5updateTorrenting.min_seeders done!");
        }


        // Clean up duplicate records from fanart

        if (!localStorage.getItem('1.1.5fanartCleanup')) {
            var cleanupDelay = 30000;
            if (localStorage.getItem('1.1.4refresh')) {
                cleanupDelay = 10000;
            }
            setTimeout(function() {
                CRUD.executeQuery("delete from Fanart where ID_Fanart not in (select max(ID_Fanart) from Fanart group by TVDB_ID)")
                .then(function(res) {
                    console.log('1.1.5fanartCleanup done!', res.rowsAffected, 'items deleted!');
                    localStorage.setItem('1.1.5fanartCleanup', new Date());
                });
            }, cleanupDelay);
            console.info("Executing the 1.1.5fanartCleanup to drop duplicate records in", cleanupDelay / 1000, "seconds.");
        }

        // delete custom engines

        if (!localStorage.getItem('1.1.5deleteSearchEngines')) {
            console.info("Executing 1.1.5deleteSearchEngines");
            CRUD.executeQuery('drop table SearchEngines');
            localStorage.setItem('1.1.5deleteSearchEngines', new Date());
            console.info("1.1.5deleteSearchEngines done!");
        }

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