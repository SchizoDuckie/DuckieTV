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
        this.watchTime = function() {
            var self = this;
            this.wTime = 0;
            CRUD.executeQuery('SELECT Sum(runtime) AS watchTime FROM (SELECT runtime FROM Episodes ' +
                            'INNER JOIN Series ON Series.ID_Serie = Episodes.ID_Serie WHERE Episodes.watched = 1)').then(function(result) {
                var next = result.next();
                while(next) {
                    self.wTime += parseInt(next);
                    next = result.next();
                }
            });
            return this.wTime;
        };

        this.watchSerie = function(){
            var self = this;
            //index 0 series watched index 1 series not watched
            this.wSerie = [0,0];
            CRUD.executeQuery('SELECT COUNT(Series.watched) AS watchedSerie FROM Series'+ 
                                ' WHERE Series.watched = 1').then(function(result){
                var res = result.next();
                if(res)
                    self.wSerie[0] = parseInt(res.get('watchedSerie'));
            });
            CRUD.executeQuery('SELECT COUNT(Series.watched) AS nonWatchedSerie FROM Series '+
                            ' WHERE Series.watched = 0').then(function(result){
                var res = result.next();
                if(res)
                    self.wSerie[1] = parseInt(res.get('watchedSerie'));
            });
            return this.wSerie;
        };
    }
);
