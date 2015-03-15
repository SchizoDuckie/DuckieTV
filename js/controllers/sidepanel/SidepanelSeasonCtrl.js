/**
 * Show one season
 */
DuckieTV.controller('SidepanelSeasonCtrl', function(season, episodes, SceneNameResolver, EpisodeAiredService, $scope, $filter) {
    this.season = season;
    this.episodes = episodes;

    this.episodes.map(function(episode) {
        $scope.$on('magnet:select:' + episode.TVDB_ID, function(evt, magnet) {
            this.magnetHash = magnet;
            this.Persist();
        }.bind(episode));
    });

    this.getPageHeader = function(season) {
        return season.seasonnumber == 0 ? $filter('translate')('SIDEPANEL/EPISODES/specials/lbl') : $filter('translate')('SIDEPANEL/EPISODES/season/lbl') + ' ' + season.seasonnumber;
    };

    this.getSortEpisodeNumber = function(episode) {
        var sn = episode.seasonnumber.toString(),
            en = episode.episodenumber.toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
        return out;
    };

    this.autoDownload = function(serie, episode) {
        EpisodeAiredService.autoDownload(serie, episode);
    };

    this.autoDownloadAll = function() {
        Array.prototype.map.call(document.querySelectorAll(".rightpanel .auto-download"), function(el, idx) {
            setTimeout(function() {
                el.click();
            }, idx * 100);
        })
    }

    this.markAllWatched = function(episodes) {
        episodes.map(function(episode) {
            if ((episode.hasAired()) && (!episode.isWatched())) {
                episode.markWatched();
            };
        });
    };


    this.getSearchString = function(serie, episode) {
        if (!serie || !episode) return;
        var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
        return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + SceneNameResolver.getSearchStringForEpisode(serie, episode);
    };

    this.getEpisodeNumber = function(episode) {
        var sn = episode.seasonnumber.toString(),
            en = episode.episodenumber.toString(),
            out = ['s', sn.length == 1 ? '0' + sn : sn, 'e', en.length == 1 ? '0' + en : en].join('');
        return out;
    };

    this.points = [];
    var data = $filter('orderBy')(this.episodes, this.getEpisodeNumber, false);
    for (var i = 0; i < data.length; i++) {

        this.points.push({
            x: i,
            y: data[i].rating,
            label: this.getEpisodeNumber(data[i]) + ' : ' + data[i].rating,
            season: parseInt(data[i].seasonnumber, 10)
        });
    };

})