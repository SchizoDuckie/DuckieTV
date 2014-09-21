angular.module('DuckieTV.controllers.episodes', [])

.controller('EpisodeCtrl',

    function(SettingsService, FavoritesService, SceneNameResolver, $routeParams, $scope, $rootScope, $filter) {

        $scope.searching = false;
        $scope.serie = null;
        $scope.episode = null;
        $scope.episodeEntity = null;
        var genreList = [
            'Action',
            'Adventure',
            'Animation',
            'Children',
            'Comedy',
            'Crime',
            'Documentary',
            'Drama',
            'Family',
            'Fantasy',
            'Food',
            'Game Show',
            'Home and Garden',
            'Horror',
            'Mini Series',
            'Mystery',
            'News',
            'No Genre',
            'Reality',
            'Romance',
            'Science Fiction',
            'Soap',
            'Special Interest',
            'Sport',
            'Suspense',
            'Talk Show',
            'Thriller',
            'Travel',
            'Western'
        ]; // used by translateGenre()
        var rawTranslatedGenreList = $filter('translate')('SERIECTRLjs/genre/list');
        var translatedGenreList = rawTranslatedGenreList.split(',');
        var statusList = [
            'Continuing',
            'Ended'
        ]; // used by translateStatus()
        var rawTranslatedStatusList = $filter('translate')('SERIECTRLjs/status/list');
        var translatedStatusList = rawTranslatedStatusList.split(',');

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
        };

        $scope.translateGenre = function(genre) {
            /*
             * takes the English genre (as fetched from TraktTV) and returns a translation 
             */
            return (genreList.indexOf(genre) != -1) ? translatedGenreList[genreList.indexOf(genre)] : genre;
        };

        $scope.translateStatus = function(status) {
            /*
             * takes the English status (as fetched from TraktTV) and returns a translation 
             */
            return (statusList.indexOf(status) != -1) ? translatedStatusList[statusList.indexOf(status)] : status;
        };

    });