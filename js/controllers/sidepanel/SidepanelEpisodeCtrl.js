DuckieTV.controller('SidepanelEpisodeCtrl', function(serie, episode, season, SceneNameResolver, EpisodeAiredService, TorrentSearchEngines, uTorrent, Netflix, $scope) {

    this.serie = serie;
    this.episode = episode;
    this.season = season;
    var self = this;


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

    this.isNetflixSerie = function() {
        return this.serie.network.toLowerCase() == 'netflix';
    };

    this.openNetflix = function() {
        Netflix.isLoggedIn().then(function(result) {
            console.log("Netflix logged in? ", result);
            if (!result) {
                alert('You are not logged in to Netflix. Please login, then you can close the window, and press this button again');
                window.open('http://www.netflix.com/Login');
            } else {
                Netflix.findShow(self.serie.name).then(function(result) {
                    console.log("Found show on netflix!", result);
                    Netflix.findEpisode(result.id, episode.episodename).then(function(result) {
                        console.log("Found episode link!", result);
                        if (result !== false) {
                            window.open(result);
                        }
                    });
                })
            }
        })
    }


    $scope.$on('magnet:select:' + this.episode.TVDB_ID, function(evt, magnet) {
        this.magnetHash = magnet;
        this.Persist();
    }.bind(this.episode));
})