DuckieTV.controller('SidepanelSeasonsCtrl', function(seasons, $rootScope, $q) {
    var self = this;
    this.seasons = seasons;

    this.markAllWatched = function() {

        $q.all(this.seasons.map(function(season) {
            season.watched = 1;
            return season.Persist().then(function() {
                return true;
            });
        })).then(function() {
            var query = "update Episodes set watched = 1, downloaded = 1, watchedAt = ? where watched = 0 and ID_Serie = ? and firstaired <= ? and firstaired > 0";
            CRUD.executeQuery(query, [new Date().getTime(), self.seasons[0].ID_Serie, new Date().getTime()]).then(function() {
                $rootScope.$broadcast('serie:recount:watched', self.seasons[0].ID_Serie);
            }.bind(this));
        });
    };
});