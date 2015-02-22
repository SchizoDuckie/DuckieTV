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

            this.state = '';
            this.serie = null;
            this.season = null;
            this.seasons = null;
            this.episode = null;
            this.episodes = null;

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

            this.showSeasons = function() {
                this.expand();
                this.state = 'seasons';
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

            this.setSeason = function(season, dontActivate) {
                sidepanel.season = season;
                sidepanel.episodes = [];
                if (undefined === dontActivate) {
                    sidepanel.state = 'episodes';
                }
                sidepanel.showSeason = false;

                season.getEpisodes().then(function(data) {
                    sidepanel.episodes = data;
                    $scope.$digest();

                });
            }


            /*
             * When an episode has been selected from the calendar
             * load all relevant data, seasons, episodes serie details.
             */
            $rootScope.$on('serie:select', function(event, serie) {
                sidepanel.serie = serie;
                sidepanel.episode = null;
                sidepanel.showSerie();

                sidepanel.serie.getSeasons().then(function(result) {
                    console.info("Fetched Seasons", result)
                    sidepanel.seasons = result;
                    sidepanel.serie.getLatestSeason().then(function(season) {
                        sidepanel.setSeason(season, true);
                    })
                });
            });
            /*
             * When an episode has been selected from the calendar
             * load all relevant data, seasons, episodes serie details.
             */
            $rootScope.$on('episode:select', function(event, serie, episode) {
                sidepanel.serie = serie;
                sidepanel.episode = episode;
                sidepanel.show();

                sidepanel.serie.getSeasons().then(function(result) {
                    console.info("Fetched Seasons", result)
                    sidepanel.seasons = result;
                    sidepanel.serie.getLatestSeason().then(sidepanel.setSeason);
                });
            });

            $rootScope.$on('settings:show', function(event, tab) {
                sidepanel.state = 'settings';
                sidepanel.settingsTab = tab;
                sidepanel.expand();
                $rootScope.$broadcast('calendar:zoomoutmore');
            });
        }
    }
})