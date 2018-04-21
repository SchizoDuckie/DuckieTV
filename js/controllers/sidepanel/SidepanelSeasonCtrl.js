/**
 * Controller for individual season view (episodes view)
 */
DuckieTV.controller('SidepanelSeasonCtrl', ["$rootScope", "$scope", "$state", "$filter", "$q", "$injector", "seasons", "season", "episodes", "SceneNameResolver", "AutoDownloadService", "SettingsService",
    function($rootScope, $scope, $state, $filter, $q, $injector, seasons, season, episodes, SceneNameResolver, AutoDownloadService, SettingsService) {

    var vm = this;
    this.season = season;
    this.seasons = seasons;
    this.episodes = episodes;
    this.seasonIndex = null;
    this.watchedDownloadedPaired = SettingsService.get('episode.watched-downloaded.pairing');

    /**
     * Closes the SidePanel expansion
     */
    this.closeSidePanelExpansion = function() {
        $injector.get('SidePanelState').contract();
        $state.go('serie');
    }

    // Find the current Season Index relative to all Seasons
    for (var i = 0; i < this.seasons.length; i++) {
        if (this.seasons[i].ID_Season == this.season.ID_Season) {
            this.seasonIndex = i;
        }
    }

    this.gotoPreviousSeason = function() {
        // If we're on the last season or specials
        if (this.seasonIndex === this.seasons.length - 1) {
            return;
        } else {
            $state.go('serie.season', {
                'season_id': seasons[this.seasonIndex + 1].ID_Season
            });
        }
    };

    this.gotoFirstSeason = function() {
        $state.go('serie.season', {
            'season_id': seasons[this.seasons.length - 1].ID_Season
        });
    };

    this.gotoNextSeason = function() {
        // Seasons are sorted by latest to oldest therefore 0 should always the be latest.
        if (this.seasonIndex === 0) {
            return;
        } else {
            $state.go('serie.season', {
                'season_id': seasons[this.seasonIndex - 1].ID_Season
            });
        }
    };

    this.gotoLastSeason = function() {
        $state.go('serie.season', {
            'season_id': seasons[0].ID_Season
        });
    };

    this.episodes.map(function(episode) {
        /**
         * This watches for the torrent:select event that will be fired by the
         * TorrentSearchEngines when a user selects a magnet or .torrent link for an episode.
         */
        $scope.$on('torrent:select:' + episode.TVDB_ID, function(evt, magnet) {
            this.magnetHash = magnet;
            this.downloaded = 0;
            this.Persist();
        }.bind(episode));
    });

    // Return 'Specials' header if current season is Specials.
    this.getPageHeader = function(season) {
        if (!season) return '';
        return season.seasonnumber === 0 ? $filter('translate')('COMMON/specials/lbl') : $filter('translate')('COMMON/season/lbl') + ' ' + season.seasonnumber;
    };

    this.getSortEpisodeNumber = function(episode) {
        var sn = episode.seasonnumber.toString(),
            en = episode.episodenumber.toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
        return out;
    };

    this.autoDownload = function(serie, episode) {
        AutoDownloadService.autoDownload(serie, episode);
    };

    this.autoDownloadAll = function() {
        Array.prototype.map.call(document.querySelectorAll(".rightpanel .auto-download-episode"), function(el, idx) {
            setTimeout(function() {
                el.click();
            }, (idx + 1) * 100); // a setTimeout with 0ms (first element index of 0 times 100) seems to result in the first click to not fire,so we bump idx up by 1
        });
    };

    this.markAllWatched = function() {
        this.season.markSeasonAsWatched(this.watchedDownloadedPaired,$rootScope).then(function() {
            $rootScope.$broadcast('serie:recount:watched', season.ID_Serie);
        });
    };

    this.markAllDownloaded = function(episodes) {
        episodes.map(function(episode) {
            if ((episode.hasAired()) && (!episode.isDownloaded())) {
                episode.markDownloaded($rootScope);
            }
        });
    };

    this.getSearchString = function(serie, episode) {
        if (!serie || !episode) return;
        return serie.name + ' ' + episode.getFormattedEpisode();
    };

    this.getSeasonSearchString = function(serie, season) {
        if (!serie || !season) return;
        return SceneNameResolver.getSceneName(serie.TVDB_ID, serie.name) + ' season ' + season.seasonnumber;
    };

    this.getEpisodeNumber = function(episode) {
        var sn = episode.seasonnumber.toString(),
            en = episode.episodenumber.toString(),
            out = ['s', sn.length == 1 ? '0' + sn : sn, 'e', en.length == 1 ? '0' + en : en].join('');
        return out;
    };

    // Ratings graph
    this.points = [];
    var data = $filter('orderBy')(this.episodes, this.getEpisodeNumber, false); // sort episodes by episode number
    data.map(function(episode) {
        vm.points.push({
            y: episode.rating,
            label: vm.getEpisodeNumber(episode) + ' : ' + episode.rating + '% (' + episode.ratingcount + ' ' + $filter('translate')('COMMON/votes/lbl') + ')',
            season: parseInt(episode.seasonnumber, 10)
        });
    });
}]);
