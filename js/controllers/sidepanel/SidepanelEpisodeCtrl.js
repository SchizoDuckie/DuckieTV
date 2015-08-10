DuckieTV.controller('SidepanelEpisodeCtrl', function(serie, episode, season, SceneNameResolver, AutoDownloadService, TorrentSearchEngines, SubtitleDialog, DuckieTorrent, Netflix, dialogs, $scope, $filter) {

    this.serie = serie;
    this.episode = episode;
    this.season = season;
    var self = this;


    this.autoDownload = function() {
        AutoDownloadService.autoDownload(this.serie, this.episode);
    };

    this.torrentSettings = function() {
        dialogs.create('templates/settings/serieTorrentSettings.html', 'serieTorrentSettingsCtrl', {
            serie: self.serie
        }, {
            bindToController: true,
            size: 'xs'
        });
    };

    this.getSearchString = function(serie, episode) {
        if (!serie || !episode) return;
        return serie.name + ' ' + episode.getFormattedEpisode();
    };

    this.isTorrentClientConnected = function() {
        return DuckieTorrent.getClient().getRemote().isConnected();
    };

    this.isNetflixSupported = function() {
        return navigator.userAgent.toLowerCase().indexOf('standalone') === -1;
    };

    this.isNetflixSerie = function() {
        if (!this.serie.network) return false;
        return this.serie.network.toLowerCase() == 'netflix';
    };

    this.openNetflix = function() {
        Netflix.isLoggedIn().then(function(result) {
            if (!result) {
                alert($filter('translate')('SIDEPANELEPISODECTRLjs/please-login-netflix/alert'));
                window.open('http://www.netflix.com/Login');
            } else {
                Netflix.findShow(self.serie.name).then(function(result) {
                    //console.debug("Found show on netflix!", result);
                    Netflix.findEpisode(result.id, episode.episodename).then(function(result) {
                        //console.debug("Found episode link!", result);
                        if (result !== false) {
                            window.open(result);
                        }
                    });
                });
            }
        });
    };

    this.findSubtitle = function() {
        SubtitleDialog.searchEpisode(this.serie, this.episode);
    };

    /*
     * This watches for the magnet:select event that will be fired by the
     * TorrentSearchEngines when a user selects a magnet link for an episode.
     */
    $scope.$on('magnet:select:' + this.episode.TVDB_ID, function(evt, magnet) {
        this.magnetHash = magnet;
        this.Persist();
    }.bind(this.episode));
});