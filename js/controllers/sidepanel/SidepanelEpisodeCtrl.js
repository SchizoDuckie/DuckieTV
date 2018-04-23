DuckieTV.controller('SidepanelEpisodeCtrl', ["serie", "episode", "season", "SceneNameResolver", "AutoDownloadService", "TorrentSearchEngines", "SubtitleDialog", "DuckieTorrent", "dialogs", "$scope", "$filter", "$injector", "SettingsService", function(serie, episode, season, SceneNameResolver, AutoDownloadService, TorrentSearchEngines, SubtitleDialog, DuckieTorrent, dialogs, $scope, $filter, $injector, SettingsService) {

    this.serie = serie;
    this.episode = episode;
    this.season = season;
    var self = this;

    /**
     * Closes the SidePanel 
     */
    this.closeSidePanel = function() {
        $injector.get('$state').go('calendar');
    }

    this.markLeaked = function() {
        this.leaked = 1;
        this.Persist();
    }.bind(this.episode);

    this.autoDownload = function() {
        AutoDownloadService.autoDownload(this.serie, this.episode);
    };

    this.torrentSettings = function() {
        var d = dialogs.create('templates/settings/serieSettings.html', 'serieSettingsCtrl', {
            serie: self.serie
        }, {
            bindToController: true,
            size: 'xs'
        });

        d.result.then(function() {
            d = undefined;
        }, function() {
            d = undefined;

        });
    };

    this.getSearchString = function(serie, episode) {
        if (!serie || !episode) return;
        return serie.name + ' ' + episode.getFormattedEpisode();
    };

    this.isTorrentClientConnected = function() {
        return DuckieTorrent.getClient().getRemote().isConnected();
    };

    this.findSubtitle = function() {
        SubtitleDialog.searchEpisode(this.serie, this.episode);
    };

    /**
     * This watches for the torrent:select event that will be fired by the
     * TorrentSearchEngines when a user selects a magnet or .torrent link for an episode.
     */
    $scope.$on('torrent:select:' + this.episode.TVDB_ID, function(evt, magnet) {
        this.magnetHash = magnet;
        this.downloaded = 0;
        this.Persist();
    }.bind(this.episode));
}]);
