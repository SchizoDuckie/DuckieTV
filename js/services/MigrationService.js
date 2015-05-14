DuckieTV
/**
 * Migrations that run when updating DuckieTV version.
 */
.run(['FavoritesService',
    function(FavoritesService) {

        // Update the newly introduced episodes.downloaded status

        if (!localStorage.getItem('1.00migration')) {
            setTimeout(function() {
                CRUD.EntityManager.getAdapter().db.execute("update Episodes set downloaded = 1 where watched == 1").
                then(CRUD.EntityManager.getAdapter().db.execute("select group_concat(ID_Episode) as affected from Episodes  group by  ID_Serie, seasonnumber, episodenumber having count(seasonnumber||','||episodenumber) > 1").then(function(result) {
                    var affected = [];

                    for (var i = 0; i < result.rs.rows.length; i++) {
                        var row = result.rs.rows.item(i);
                        row.affected.split(',').map(function(item) {
                            affected.push(item)
                        });
                    }
                    return CRUD.EntityManager.getAdapter().db.execute("delete from Episodes where  ID_Episode in (" + affected.join(',') + ") AND (TVDB_ID IS null OR  episodename IS null or IMDB_ID IS NULL)");
                })).
                then(function() {
                    console.log("1.00 migration done.");
                    localStorage.setItem('1.00migration', new Date());
                    return FavoritesService.refresh();
                });


            }, 2000);
            console.info("Executing the 1.00 migration to populate episodes.downloaded status");
        }


    }
])