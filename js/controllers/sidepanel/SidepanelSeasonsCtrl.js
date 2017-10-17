/**
 * Controller for all seasons view
 */
DuckieTV.controller('SidepanelSeasonsCtrl', ["$rootScope", "$q", "$filter", "$state", "seasons", "SidePanelState", "SettingsService",
    function($rootScope, $q, $filter, $state, seasons, SidePanelState, SettingsService) {
    var self = this;
    this.seasons = seasons;
    this.markAllWatchedAlert = false;
    this.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing');

    /**
     * Closes the SidePanel expansion
     */
    this.closeSidePanelExpansion = function() {
        SidePanelState.contract();
    }

    this.markAllWatched = function() {
        this.seasons.map(function(season) {
            season.markSeasonAsWatched(this.watchedDownloadedPaired,$rootScope).then(function() {
                $rootScope.$broadcast('serie:recount:watched', season.ID_Serie);
                self.markAllWatchedAlert = false; // reset alert flag
            });
        });
    };

    this.markAllWatchedCancel = function() {
        self.markAllWatchedAlert = false; // reset alert flag
    };

    this.markAllWatchedQuery = function() {
        self.markAllWatchedAlert = true; // set alert flag
    };

    this.getPosterLabel = function(seasonNumber) {
        return seasonNumber === 0 ? $filter('translate')('COMMON/specials/lbl') : $filter('translate')('COMMON/season/lbl') + ' ' + seasonNumber;
    };
}]);