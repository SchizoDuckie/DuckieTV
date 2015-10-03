/**
 * Controller for indidivual season view (episodes view)
 */
DuckieTV.controller('SidepanelSeasonCtrl', function($rootScope, $scope, $state, $filter, $q, seasons, season, episodes, SceneNameResolver, AutoDownloadService) {

    this.season = season;
    this.seasons = seasons;
    this.episodes = episodes;
    this.seasonIndex = null;

    // Find the current Season Index relative to all Seasons
    for (var i = 0; i < this.seasons.length; i++) {
        if (this.seasons[i].ID_Season == this.season.ID_Season) {
            this.seasonIndex = i;
        }
    }

    this.gotoPreviousSeason = function() {
        // If we're on the last season or specials
        if (this.seasonIndex === this.seasons.length-1) {
            return;
        } else {
            $state.go('serie.season', {'season_id': seasons[this.seasonIndex+1].ID_Season});
        }        
    };

   
    this.gotoNextSeason = function() {
        // Seasons are sorted by latest to oldest therefore 0 should always the be latest.
        if (this.seasonIndex === 0) {
            return;
        } else {
            $state.go('serie.season', {'season_id': seasons[this.seasonIndex-1].ID_Season});
        }        
    };

    this.episodes.map(function(episode) {
        /**
         * This watches for the magnet:select event that will be fired by the
         * TorrentSearchEngines when a user selects a magnet link for an episode.
         */
        $scope.$on('magnet:select:' + episode.TVDB_ID, function(evt, magnet) {
            this.magnetHash = magnet;
            this.Persist();
        }.bind(episode));
    });

    // Return 'Specials' header if current season is Specials.
    this.getPageHeader = function(season) {
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

    this.markAllWatched = function(episodes) {
        var serie = this.season.ID_Serie;
        $q.all(episodes.map(function(episode) {
            if ((episode.hasAired()) && (!episode.isWatched())) {
                return episode.markWatched().then(function() {
                    return true;
                });
            }
            return true;
        })).then(function() {
            $rootScope.$broadcast('serie:recount:watched', serie);
        });
    };

    this.markAllDownloaded = function(episodes) {
        episodes.map(function(episode) {
            if ((episode.hasAired()) && (!episode.isDownloaded())) {
                episode.markDownloaded();
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
    var data = $filter('orderBy')(this.episodes, this.getEpisodeNumber, false);
    for (var i = 0; i < data.length; i++) {
        this.points.push({
            x: i,
            y: data[i].rating,
            label: this.getEpisodeNumber(data[i]) + ' : ' + data[i].rating + '% (' + data[i].ratingcount + ' ' + $filter('translate')('SIDEPANEL/SERIE-DETAILS/votes/lbl') + ')',
            season: parseInt(data[i].seasonnumber, 10)
        });
    }
});