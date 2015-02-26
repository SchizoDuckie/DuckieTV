angular.module('DuckieTV.controllers.sidepanel', ['dialogs'])

.controller('SidepanelSerieCtrl', function($dialogs, $filter, FavoritesService, $location, serie, latestSeason) {

    this.serie = serie;
    this.latestSeason = latestSeason;

    this.toggleSerieDisplay = function() {
        this.serie.displaycalendar = sidepanel.serie.displaycalendar == '1' ? '0' : '1';
        this.serie.Persist().then(function() {
            $rootScope.$broadcast('favorites:updated');
        });
    };

    /**
     * Pop up a confirm dialog and remove the serie from favorites when confirmed.
     */
    this.removeFromFavorites = function() {
        var dlg = $dialogs.confirm($filter('translate')('SERIESLISTjs/serie-delete/hdr'),
            $filter('translate')('SERIESLISTjs/serie-delete-question/p1') +
            this.serie.name +
            $filter('translate')('SERIESLISTjs/serie-delete-question/p2')
        );
        dlg.result.then(function(btn) {
            console.log("Removing serie '" + serie.name + "' from favorites!", serie);
            FavoritesService.remove(serie);
            $location.path('/');
        }, function(btn) {
            this.confirmed = $filter('translate')('SERIESLISTjs/serie-delete-confirmed');
        });
    };
})



.controller('SidepanelSeasonsCtrl', function(seasons) {
    this.seasons = seasons;
})

/**
 * Show one season
 */
.controller('SidepanelSeasonCtrl', function(season, episodes, SceneNameResolver, EpisodeAiredService, $scope) {
    this.season = season;
    this.episodes = episodes;

    this.episodes.map(function(episode) {
        $scope.$on('magnet:select:' + episode.TVDB_ID, function(evt, magnet) {
            this.magnetHash = magnet;
            this.Persist();
        }.bind(episode));
    });

    this.getSortEpisodeNumber = function(episode) {
        var sn = episode.seasonnumber.toString(),
            en = episode.episodenumber.toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
        return out;
    };

    this.autoDownload = function(serie, episode) {
        EpisodeAiredService.autoDownload(serie, episode);
    };

    this.getSearchString = function(serie, episode) {
        if (!serie || !episode) return;
        var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
        return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + SceneNameResolver.getSearchStringForEpisode(serie, episode);
    };


})

.controller('SidepanelEpisodeCtrl', function(serie, episode, season, SceneNameResolver, EpisodeAiredService, TorrentDialog, uTorrent, $scope) {

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