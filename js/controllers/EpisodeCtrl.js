angular.module('DuckieTV.controllers.episodes', [])

.controller('EpisodeCtrl',

    function(TheTVDB, ThePirateBay, SettingsService, FavoritesService, SceneNameResolver, $routeParams, $scope, $rootScope) {

        $scope.searching = false;
        $scope.serie = null;
        $scope.episode = null;
        $scope.episodeEntity = null;

        CRUD.FindOne('Serie', {
            'TVDB_ID': $routeParams.id
        }).then(function(serie) {
            $scope.serie = serie.asObject();
            $scope.$digest();
            serie.Find("Episode", {
                ID_Episode: $routeParams.episode
            }).then(function(epi) {
                $scope.episode = epi[0].asObject();
                $scope.episodeEntity = epi[0];
                $scope.$digest();

                $rootScope.$broadcast('serie:load', $scope.serie);
                $rootScope.$broadcast('episode:load', $scope.episode);
                if (serie.get('fanart') != '') {
                    $rootScope.$broadcast('background:load', serie.get('fanart'));
                }

                $scope.$on('magnet:select:' + $scope.episode.TVDB_ID, function(evt, magnet) {
                    console.debug("Found a magnet selected!", magnet);
                    $scope.episodeEntity.set('magnetHash', magnet);
                    $scope.episodeEntity.Persist();
                    $scope.episode = $scope.episodeEntity.asObject();
                });
            }, function(err) {
                debugger;
                console.log("Episodes booh!", err);
            });
        }, function(err) {
            debugger;
        });

        $scope.getAirDate = function(episode) {
            console.log('get air date', episode);;
            return new Date(episode.firstaired);
        }

        /**
         * Check if airdate has passed
         */
        $scope.hasAired = function(episode) {
            return episode.firstaired && episode.firstaired <= new Date().getTime();;
        };

        $scope.getSearchString = function(serie, episode) {
            var serieName = SceneNameResolver.getSceneName(serie.name) || serie.name;
            return serieName + ' ' + $scope.getEpisodeNumber(episode) + ' ' + SettingsService.get('torrenting.searchquality');
        };


        $scope.getEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
            return out;
        }



    });