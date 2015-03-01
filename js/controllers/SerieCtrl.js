/**
 * Serie controller for when in the Serie view
 */

DuckieTV.controller('SerieCtrl', ["FavoritesService", "SceneNameResolver", "TorrentDialog", "$routeParams", "$scope", "$rootScope", "$injector", "$filter", "$q", "$locale",
    function(FavoritesService, SceneNameResolver, TorrentDialog, $routeParams, $scope, $rootScope, $injector, $filter, $q, $locale) {

        $scope.episodes = [];
        $scope.points = [];
        $scope.season = null;
        $scope.seasons = null;
        $scope.activeSeason = null;
        $scope.markingAsWatched = false;
        $scope.markUntilDate = false;
        $scope.searching = false;
        var currentDate = new Date();
        var allSeasons = [];

        $scope.$on('favorites:updated', $scope.getSerie);
        $scope.$on('episodes:updated', $scope.getSerie);

        function fetchEpisodes(season) {
            if (!season) return;
            $scope.season = season;

            // Get all episodes for season
            var episodes = season.getEpisodes().then(function(data) {
                $scope.episodes = data.map(function(el) {
                    $scope.$on('magnet:select:' + el.TVDB_ID, function(evt, magnet) {
                        this.magnetHash = magnet;
                        this.Persist();
                    }.bind(el));
                    return el;
                });

                // Episode ratings graph
                $scope.points = [];
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
                console.error("Could not find episodes for serie", err);
            }, function(err) {
                console.error("Error fetching latest season's episodes!", err);
            });
        };

        // Load serie fanart and seasons and set latest season as active
        FavoritesService.refresh(true).then(function(series) {
            $scope.serie = FavoritesService.getById($routeParams.id);
            if ($scope.serie.fanart != '') {
                $rootScope.$broadcast('background:load', $scope.serie.fanart);
            };
            $scope.serie.getSeasons().then(function(result) {
                $scope.seasons = result;
            });
            $scope.serie.getLatestSeason().then(function(result) {
                $scope.activeSeason = result;
                fetchEpisodes(result);
            });
            $rootScope.$broadcast('serie:load', $scope.serie);
        });

        // Update the episode list as the season changes
        $scope.$watch('activeSeason', function(newVal, old) {
            fetchEpisodes(newVal);
        });

        /**
         * Check if airdate has passed
         */
        $scope.hasAired = function(serie) {
            return serie.firstaired && new Date(serie.firstaired) <= currentDate;
        };

        // Function to batch mark episodes as watched
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

        $scope.markRangeWatchedStart = function() {
            $scope.markingAsWatched = true;
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

        // Get formatted search string
        $scope.getSearchString = function(serie, episode) {
            var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
            return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + SceneNameResolver.getSearchStringForEpisode(serie, episode);
        };

        // Get formatted episode number
        $scope.getEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
            return out;
        };

        // Format episode number as S01E01 instead of S1E1 or something
        $scope.getSortEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
            return out;
        };

        // Search torrent for season
        $scope.searchSeason = function(serie, season, $event) {
            TorrentDialog.search(serie.name + ' season ' + season.seasonnumber);
        };
    }
])