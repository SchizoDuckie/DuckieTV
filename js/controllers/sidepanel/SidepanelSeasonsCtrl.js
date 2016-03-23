/**
 * Controller for all seasons view
 */
DuckieTV.controller('SidepanelSeasonsCtrl', ["seasons", "$rootScope", "$q", "$filter", function(seasons, $rootScope, $q, $filter) {
    var self = this;
    this.seasons = seasons;

    this.markAllWatched = function() {
        this.seasons.map(function(season) {
            season.markSeasonAsWatched($rootScope).then(function() {
                $rootScope.$broadcast('serie:recount:watched', season.ID_Serie);
            });
        });
    };

    this.getPosterLabel = function(seasonNumber) {
        return seasonNumber === 0 ? $filter('translate')('COMMON/specials/lbl') : $filter('translate')('COMMON/season/lbl') + ' ' + seasonNumber;
    };
}]);