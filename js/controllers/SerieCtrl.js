angular.module('DuckieTV.controllers.serie', ['DuckieTV.directives.serieheader', 'DuckieTV.directives.seriedetails', 'DuckieTV.directives.episodewatched'])

.controller('SerieCtrl',

    function(FavoritesService, SceneNameResolver, TraktTV, TorrentDialog, $routeParams, $scope, $rootScope, $injector, $filter, $q, $locale) {
        $scope.episodes = [];
        $scope.points = [];
        $scope.season = null;
        $scope.seasons = null;
        $scope.activeSeason = null;
        $scope.markingAsWatched = false;
        $scope.markUntilDate = false;

        $scope.$on('favorites:updated', $scope.getSerie);
        $scope.$on('episodes:updated', $scope.getSerie);

        $scope.searching = false;
        var currentDate = new Date();
        var allSeasons = [];


    function fetchEpisodes(season) {
            if (!season) return;
            $scope.season = season;

            var episodes = season.getEpisodes().then(function(data) {
                $scope.episodes = data.map(function(el) {
                    $scope.$on('magnet:select:' + el.TVDB_ID, function(evt, magnet) {
                        this.magnetHash = magnet;
                        this.Persist();
                    }.bind(el));
                    return el;
                });
                $scope.points = [];
                $scope.labels = [];
                data = $filter('orderBy')($scope.episodes, $scope.getEpisodeNumber, false);
                for (var i = 0; i < data.length; i++) {

                    $scope.points.push({
                        x: i,
                        y: data[i].rating,
                        label: $scope.getEpisodeNumber(data[i]) + ' : ' + data[i].rating,
                        season: parseInt(data[i].seasonnumber, 10)
                    });
                };
                $scope.$digest();
            }, function(err) {
                console.log("Could not find episodes for serie", err);
            }, function(err) {
                console.error("Error fetching latest season's episodes!", err);
            });
        };

        FavoritesService.getById($routeParams.id).then(function(serie) {
            $scope.serie = serie;
            $rootScope.$broadcast('serie:load', $scope.serie);

            if (serie.fanart != '') {
                $rootScope.$broadcast('background:load', serie.fanart);
            };
            serie.getSeasons().then(function(result) {
                $scope.seasons = result;
            });
            serie.getLatestSeason().then(function(result) {
                $scope.activeSeason = result;
                fetchEpisodes(result);
            });

        });

        $scope.$watch('activeSeason', function(newVal, old) {
            fetchEpisodes(newVal);
        });

        /**
         * Check if airdate has passed
         */
        $scope.hasAired = function(serie) {
            return serie.firstaired && new Date(serie.firstaired) <= currentDate;
        };

        $scope.markRange = function(episode) {
            if (!$scope.markingAsWatched) return;
            $scope.markUntilIndex = episode.episodenumber;
            $scope.markingAsWatched = false;

            var pq = [];
            $scope.episodes.map(function(episode, index) {
                if (episode.episodenumber <= $scope.markUntilIndex) {
                    episode.markWatched($rootScope);
                }
            });

            $q.all(pq).then(function() {
                $rootScope.$broadcast('calendar:clearcache');
            });
        };

        $scope.setMarkEnd = function(episode) {
            $scope.markUntilIndex = episode.episodenumber;
        };

        $scope.isMarkBeforeEnd = function(episode) {
            return $scope.markingAsWatched && $scope.hasAired(episode) && parseInt($scope.markUntilIndex) >= parseInt(episode.episodenumber, 10);
        };

        $scope.stopMarkingAsWatched = function() {
            $scope.markingAsWatched = false;
        };

        $scope.getSearchString = function(serie, episode) {
            var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
            return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + $scope.getEpisodeNumber(episode);
        };

        $scope.getEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
            return out;
        };

        $scope.getSortEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
            return out;
        };

        $scope.tvRageSync = function(serie, episodes) {
            TVRageSyncService.syncEpisodes(serie, episodes);
        };

        $scope.searchSeason = function(serie, season, $event) {
            TorrentDialog.search(serie.name + ' season ' + season.seasonnumber);
        };

        $scope.markRangeWatchedStart = function() {
            $scope.markingAsWatched = true;
        };

    })