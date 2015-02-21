angular.module('DuckieTV.directives.sidepanel', ['DuckieTV.providers.favorites', 'DuckieTV.providers.episodeaired'])

.directive('sidepanel', function() {
    return {
        restrict: 'E',
        templateUrl: 'templates/sidepanel/sidepanel.html',
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
        },
        controller: function($rootScope, $scope, FavoritesService, EpisodeAiredService, SceneNameResolver, uTorrent) {

            var sidepanel = this;

            var allSeasons = [];

            this.state = '';
            this.serie = null;
            this.season = null;
            this.seasons = null;
            this.episode = null;
            this.episodes = null;

            this.isShowing = false;
            this.isExpanded = false;

            this.clearCache = function() {
                this.serie = this.season = this.seasons = this.episode = this.episodes = null;
                console.info("Cache cleared!");
                console.info("Following 4 variables should be null (season | seasons | episode | episodes)");
                console.info(this.season, this.seasons, this.episode, this.episodes);
            }

            this.toggle = function() {
                this.isShowing ? this.hide() : this.show();

            };
            this.show = function() {
                console.info("Showing Sidepanel");
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
                $rootScope.$broadcast('calendar:zoomout');
            };

            this.zoomIn = function() {
                $rootScope.$broadcast('calendar:zoomin');
            }

            this.showSerie = function() {
                this.expand();
                this.state = 'serie';
                $rootScope.$broadcast('calendar:zoomoutmore');
            };

            this.showEpisodes = function() {
                this.expand();
                this.state = 'episodes';
                $rootScope.$broadcast('calendar:zoomoutmore');
            };

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
                sidepanel.serie.displaycalendar = sidepanel.serie.displaycalendar == '1' ? '0' : '1';
                sidepanel.serie.Persist().then(function() {
                    $rootScope.$broadcast('favorites:updated');
                });
            };

            $rootScope.$on('episode:select', function(event, serie, episode) {
                console.info("Episode Select detected");
                sidepanel.serie = serie;
                sidepanel.episode = episode;
                sidepanel.show();

                sidepanel.serie.getSeasons().then(function(result) {
                    console.info("Fetched Seasons", result)
                    sidepanel.seasons = result;
                    sidepanel.serie.getLatestSeason().then(function(season) {
                        season.getEpisodes().then(function(data) {
                            sidepanel.episodes = data;
                        });
                    });
                });
            });

            $rootScope.$on('season:select', function() {

            });
        }
    }
})