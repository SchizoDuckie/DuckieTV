DuckieTV.controller('SidepanelEpisodeCtrl', function(serie, episode, season, SceneNameResolver, EpisodeAiredService, TorrentDialog, uTorrent, $scope) {

    this.serie = serie;
    this.episode = episode;
    this.season = season;


    this.autoDownload = function() {
        EpisodeAiredService.autoDownload(this.serie, this.episode);
    };

    this.getSearchString = function(serie, episode) {
        if (!serie || !episode) return;
        var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
        return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + SceneNameResolver.getSearchStringForEpisode(serie, episode);
    };


    this.isTorrentClientConnected = function() {
        return uTorrent.isConnected();
    };

    $scope.$on('magnet:select:' + this.episode.TVDB_ID, function(evt, magnet) {
        this.magnetHash = magnet;
        this.Persist();
    }.bind(this.episode));
})