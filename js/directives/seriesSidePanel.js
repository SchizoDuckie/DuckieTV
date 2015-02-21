angular.module('DuckieTV.directives.sidepanel', ['DuckieTV.providers.favorites', 'DuckieTV.providers.episodeaired'])

.directive('sidepanel', function() {

    return {
        restrict: 'E',
        templateUrl: 'templates/sidepanel/sidepanel.html',
        controller: 'sidepanelCtrl',
        controllerAs: 'sidepanel',
        bindToController: true,
        link: function($scope, iElement, $rootScope) {
            $scope.show2 = function() {
                iElement.addClass('active');
            };
            $scope.hide2 = function() {
                iElement.removeClass('active');
            };

            $scope.expand2 = function() {
                iElement.addClass('expanded');
            };
            $scope.contract2 = function() {
                iElement.removeClass('expanded');
            }
        }
    }
})

.controller('sidepanelCtrl', ["$rootScope", "$scope", "FavoritesService", "EpisodeAiredService", "SceneNameResolver", "uTorrent", function($rootScope, $scope, FavoritesService, EpisodeAiredService, SceneNameResolver, uTorrent) {

    var sidepanel = this;

    var allSeasons = [];

    this.state = '';
    this.serie = null;
    this.season = null;
    this.seasons = null;
    this.episode = null;

    this.isShowing = false;
    this.isExpanded = false;

    this.toggle = function() {
        this.isShowing ? this.hide() : this.show();

    };
    this.show = function() {
        this.isShowing = true;
        this.contract();
        this.zoomOut();
        $scope.show2();
    };
    this.hide = function() {
        this.isShowing = false;
        this.zoomIn();
        $scope.hide2();
    };

    this.expand = function() {
        this.show();
        this.isExpanded = true;
        $scope.expand2();
    };
    this.contract = function() {
        this.isExpanded = false;
        $scope.contract2();
    }

    this.zoomOut = function() {
        setTimeout(function() {
            $rootScope.$broadcast('calendar:zoomout');
        }, 50);
    };

    this.zoomIn = function() {
        setTimeout(function() {
            $rootScope.$broadcast('calendar:zoomin');
        }, 50);
    }

    this.showSerie = function() {
        this.expand();
        this.state = 'serie';
        setTimeout(function() {
            $rootScope.$broadcast('calendar:zoomoutmore');
        }, 50);
    };

    this.showEpisodes = function() {
        this.expand();
        this.state = 'episodes';

        setTimeout(function() {
            $rootScope.$broadcast('calendar:zoomoutmore');
        }, 50);

        this.serie.getSeasons().then(function(result) {
            this.seasons = result;
            this.serie.getLatestSeason().then(function(result) {
                this.activeSeason = result;
                fetchEpisodes(result);
            });
        });
    };

    function fetchEpisodes(season) {
        if (!season) return;
        this.season = season;

        var episodes = season.getEpisodes().then(function(data) {
            this.episodes = data.map(function(el) {
                this.$on('magnet:select:' + el.TVDB_ID, function(evt, magnet) {
                    this.magnetHash = magnet;
                    this.Persist();
                }.bind(el));
                return el;
            });

        });
    };

    this.autoDownload = function() {
        EpisodeAiredService.autoDownload(this.serie, this.episode);
    };

    this.getSearchString = function(serie, episode) {
        if(!serie || !episode) return;
        var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
        return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + SceneNameResolver.getSearchStringForEpisode(serie, episode);
    };

    this.isTorrentClientConnected = function() {
        return uTorrent.isConnected();
    };

    this.toggleSerieDisplay = function(serie) {
        CRUD.FindOne('Serie', {
            ID_Serie: serie.ID_Serie
        }).then(function(serie2) {
            if (serie2.get('displaycalendar') == 1) {
                sidepanel.serie.displaycalendar = 0;
                serie2.set('displaycalendar', 0);
            } else {
                sidepanel.serie.displaycalendar = 1;
                serie2.set('displaycalendar', 1);
            };
            // Refresh calendar & page and save updates to db
            $scope.$digest();
            serie2.Persist();
            $rootScope.$broadcast('favorites:updated');
        });
    };

    $rootScope.$on('episode:select', function(event, serie, episode) {
        console.log("Select episode!", serie, episode);
        sidepanel.serie = serie;
        sidepanel.episode = episode;
        sidepanel.show();
        setTimeout(this.$digest, 50);
    });

    $rootScope.$on('season:select', function() {

    });
}])