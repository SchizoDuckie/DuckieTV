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
                console.info("Showing Episodes");
                this.expand();
                this.state = 'episodes';

                setTimeout(function() {
                    $rootScope.$broadcast('calendar:zoomoutmore');
                }, 50);

                console.info("Fetching seasons");
                console.info("Season should be null", this.season, "Seasons should be null", this.seasons);
                this.serie.getSeasons().then(function(result) {
                    console.info("Fetched Seasons", result)
                    sidepanel.seasons = result;
                    sidepanel.serie.getLatestSeason().then(function(season) {
                        console.info("Fetched latest season", season);
                        console.info("Fetching episodes");
                        console.info("Episode should not be null", sidepanel.episode);
                        console.info("Episodes should be null", sidepanel.episodes);
                        season.getEpisodes().then(function(data) {
                            console.info("Fetched episodes", data);
                            sidepanel.episodes = data;
                            console.info("Episode data should be saved", sidepanel.episodes);
                        });
                    });
                });
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
                console.info("Episode Select detected");
                sidepanel.clearCache();
                sidepanel.serie = serie;
                sidepanel.episode = episode;
                sidepanel.show();
                setTimeout(this.$digest, 50);
            });

            $rootScope.$on('season:select', function() {

            });
        }
    }
})