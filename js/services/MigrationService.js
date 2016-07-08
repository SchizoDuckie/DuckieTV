DuckieTV
/**
 * Migrations that run when updating DuckieTV version.
 */
.run(['FavoritesService', '$rootScope', 'SettingsService', 'TorrentHashListService',
    function(FavoritesService, $rootScope, SettingsService, TorrentHashListService) {

        // Update the newly introduced series' and seasons'  watched and notWatchedCount entities

        if (!localStorage.getItem('1.1migration')) {
            setTimeout(function() {
                $rootScope.$broadcast('series:recount:watched');
                    console.info("1.1 migration done.");
                    localStorage.setItem('1.1migration', new Date());
            }, 2000);
            console.info("Executing the 1.1 migration to populate watched and notWatchedCount entities");
        }

        // Clean up Orphaned Seasons

        if (!localStorage.getItem('1.1.4cleanupOrphanedSeasons')) {
            setTimeout(function() {
                var serieIds = [];
                CRUD.executeQuery('select distinct(ID_Serie) from Series').then(function(res) {
                    while(r = res.next()) {
                        serieIds.push(r.row.ID_Serie)
                    }
                    CRUD.executeQuery('delete from Seasons where ID_Serie not in ('+serieIds.join(',')+') ').then(function(res) {
                        console.log('1.1.4cleanupOrphanedSeasons done!', res.rs.rowsAffected, 'season records deleted!')
                    });
                });
                localStorage.setItem('1.1.4cleanupOrphanedSeasons', new Date());
            }, 5000);
            console.info("Executing the 1.1.4cleanupOrphanedSeasons to remove orphaned seasons");
        }

        // Clean up Orphaned Episodes

        if (!localStorage.getItem('1.1.4cleanupOrphanedEpisodes')) {
            setTimeout(function() {
                var serieIds = [];
                CRUD.executeQuery('select distinct(ID_Serie) from Series').then(function(res) {
                    while(r = res.next()) {
                        serieIds.push(r.row.ID_Serie)
                    }
                    CRUD.executeQuery('delete from Episodes where ID_Serie not in ('+serieIds.join(',')+') ').then(function(res) {
                        console.log('1.1.4cleanupOrphanedEpisodes done!', res.rs.rowsAffected, 'episode records deleted!')
                    });
                });
                localStorage.setItem('1.1.4cleanupOrphanedEpisodes', new Date());
            }, 4000);
            console.info("Executing the 1.1.4cleanupOrphanedEpisodes to remove orphaned episodes");
        }

        // Update qBittorrent to qBittorrent (pre3.2)

        if (!localStorage.getItem('1.1.4qBittorrentPre32')) {
            console.info("Executing 1.1.4qBittorrentPre32 to rename qBittorrent to qBittorrent (pre3.2)");
            if ('qBittorrent' == localStorage.getItem('torrenting.client')) {
                localStorage.setItem('torrenting.client', 'qBittorrent (pre3.2)');
                SettingsService.set('torrenting.client', 'qBittorrent (pre3.2)');
            };
            localStorage.setItem('1.1.4qBittorrentPre32', new Date());
            console.info("1.1.4qBittorrentPre32 done!");
        }

        // remove obsolete torrentHashes from TorrentHashListService.hashList

        if (!localStorage.getItem('1.1.4TorrentHashListCleanup')) {
            setTimeout(function() {
                // collect known good torrent hashes
                var newTorrentHashList = {};
                CRUD.executeQuery("select magnetHash,downloaded from Episodes where magnetHash != ''").then(function(res) {
                    while(r = res.next()) {
                        newTorrentHashList[r.row.magnetHash] = (parseInt(r.row.downloaded) == 1);
                    };
                    // save new hashList
                    localStorage.setItem(['torrenting.hashList'], JSON.stringify(newTorrentHashList));
                    // reload TorrentHashListService.hashList
                    TorrentHashListService.hashList = JSON.parse(localStorage.getItem(['torrenting.hashList'])) || {};
                    localStorage.setItem('1.1.4TorrentHashListCleanup', new Date());
                    console.info("1.1.4TorrentHashListCleanup done!");
                });
            }, 1000);
            console.info("Executing 1.1.4TorrentHashListCleanup to remove obsolete torrentHashes from TorrentHashListService");
        }
    }
])