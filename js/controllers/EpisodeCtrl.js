angular.module('DuckieTV.controllers.episodes', [])

.controller('EpisodeCtrl',

    function(FavoritesService, SceneNameResolver, $routeParams, $scope, $rootScope, $filter) {

        $scope.searching = false;
        $scope.serie = null;
        $scope.episode = null;


        CRUD.FindOne('Serie', {
            'TVDB_ID': $routeParams.id
        }).then(function(serie) {
            $scope.serie = serie;
            $scope.$digest();
            CRUD.FindOne("Episode", {
                TVDB_ID: $routeParams.episode
            }).then(function(epi) {
                $scope.episode = epi;
                $scope.$digest();

                $rootScope.$broadcast('serie:load', $scope.serie);
                $rootScope.$broadcast('episode:load', $scope.episode);
                if (serie.fanart != '') {
                    $rootScope.$broadcast('background:load', serie.fanart);
                }

                $scope.$on('magnet:select:' + $scope.episode.TVDB_ID, function(evt, magnet) {
                    console.debug("Found a magnet selected!", magnet);
                    $scope.episode.magnetHash = magnet;
                    $scope.episode.Persist();
                });
            }, function(err) {
                debugger;
                console.error("Episodes booh!", err);
            });
        }, function(err) {
            debugger;
        });

        /**
         * Check    if airdate has passed
         */
        $scope.hasAired = function(episode) {
            return episode.firstaired && episode.firstaired <= new Date().getTime();
        };

        $scope.getSearchString = function(serie, episode) {
            var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
            return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + SceneNameResolver.getSearchStringForEpisode(serie, episode);
        };

        $scope.getEpisodeNumber = function(episode) {
            return episode.getFormattedEpisode();
        };

    });