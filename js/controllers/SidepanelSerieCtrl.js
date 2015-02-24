angular.module('DuckieTV.controllers.sidepanel', ['dialogs'])

.controller('SidepanelSerieCtrl', function($dialogs, $filter, FavoritesService, SceneNameResolver, EpisodeAiredService, TorrentDialog, uTorrent, $location, serie, episode, season, episodes, SidePanelState) {

    var sidepanel = this;

    this.state = episode !== null ? 'episodes' : 'serie';
    this.serie = serie;
    this.episode = episode;
    this.episodes = episodes;

    this.setSeason = function(season, dontActivate) {
        sidepanel.season = season;
        sidepanel.episodes = [];
        if (undefined === dontActivate) {
            sidepanel.state = 'episodes';
        }
        sidepanel.showSeason = false;

        season.getEpisodes().then(function(data) {
            sidepanel.episodes = data;
        });
    }


    if (season) {
        this.setSeason(season, true)
    } else {
        this.season = false;
    }



    this.showSerie = function() {
        SidePanelState.expand();
        this.state = 'serie';
        this.episode = false;
    };

    this.showEpisodes = function() {
        SidePanelState.expand();
        this.state = 'episodes';
    };

    this.showSeasons = function() {
        SidePanelState.expand();
        this.state = 'seasons';
        this.serie.getSeasons().then(function(result) {
            console.info("Fetched Seasons", result)
            sidepanel.seasons = result;

        });
    }


    this.getSortEpisodeNumber = function(episode) {
        var sn = episode.seasonnumber.toString(),
            en = episode.episodenumber.toString(),
            out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
        return out;
    };

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


.controller('SidepanelEpisodeCtrl', function(serie, episode, season, SidePanelState) {

    this.serie = serie;
    this.episode = episode;
    this.season = season;

})

.controller('SidepanelSettingsCtrl', function($scope, SidePanelState, tab) {
    console.log('new sidepanel settings controller!', tab);
    this.tab = (tab !== undefined) ? tab : false;
    if (this.tab) {
        SidePanelState.expand();
        $scope.$applyAsync();
    }

})