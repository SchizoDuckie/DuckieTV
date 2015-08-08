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


    }
])