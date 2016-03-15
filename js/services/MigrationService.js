DuckieTV
/**
 * Migrations that run when updating DuckieTV version.
 */
.run(['FavoritesService', '$rootScope',
    function(FavoritesService, $rootScope) {

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

    }
])