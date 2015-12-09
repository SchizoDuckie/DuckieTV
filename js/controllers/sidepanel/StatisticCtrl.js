/**
 * Setting controller for the settings pages
 *
 * Contains various controllers for different settings tabs
 */



/** 
 * Root controller for statistic page
 */
DuckieTV.controller('StatisticCtrl',

    function() {

        // Started working here
        var watchTime = function() {
            console.log("Im being called");
            CRUD.executeQuery('SELECT Sum(runtime) AS watchTime FROM (SELECT runtime FROM Episodes ' +
                            'INNER JOIN Series ON Series.ID_Serie = Episodes.ID_Serie WHERE Episodes.watched = 1)').then(function(result) {
                return parseInt(result.next().get('watchTime'));
            });
        };

        var watchSerie = function(){
            //index 0 series watched index 1 series not watched
            var watchedSerie = [];
            CRUD.executeQuery('SELECT COUNT(Series.watched) AS watchedSerie FROM Series'+ 
                                ' WHERE Series.watched = 1').then(function(result){

                watchedSerie.push(parseInt(result.next().get('watchedSerie')));
            });
            CRUD.executeQuery('SELECT COUNT(Series.watched) AS nonWatchedSerie FROM Series '+
                            ' WHERE Series.watched = 0').then(function(result){
                watchedSerie.push(parseInt(result.next().get('nonWatchedSerie')));
                return watchedSerie;
            });
        };
    }
);
