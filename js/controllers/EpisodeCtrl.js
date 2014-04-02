angular.module('DuckieTV.controllers.episodes', [])

.controller('EpisodeCtrl',

    function(TheTVDB, ThePirateBay, SettingsService, FavoritesService, SceneNameResolver, $routeParams, $scope, $rootScope) {

        $scope.searching = false;
        var currentDate = new Date().getTime();

        CRUD.FindOne('Serie', {
            'TVDB_ID': $routeParams.id
        }).then(function(serie) {
            $scope.serie = serie.asObject();
            if (serie.get('fanart') != '') {
                $rootScope.$broadcast('background:load', serie.get('fanart'));
            }
            serie.Find("Episode", {
                ID_Episode: $routeParams.episode
            }).then(function(epi) {
                $scope.episode = epi[0].asObject();
                $scope.$digest();
            }, function(err) {
                debugger;
                console.log("Episodes booh!", err);
            });
        }, function(err) {
            debugger;
        })


        /**
         * Check if airdate has passed
         */
        $scope.hasAired = function(serie) {
            return serie.firstaired && serie.firstaired <= currentDate;
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

        $scope.searchTorrents = function(serie, episode) {
            $scope.items = [];
            $scope.searching = true;
            var search = $scope.getSearchString(serie, episode);
            ThePirateBay.search(search).then(function(results) {
                $scope.items = results;
                $scope.searching = false;
            }, function(e) {
                console.error("TPB search failed!");
                $scope.searching = false;
            });
        }

    });