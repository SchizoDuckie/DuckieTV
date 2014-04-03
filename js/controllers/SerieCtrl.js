angular.module('DuckieTV.controllers.serie', ['DuckieTV.providers.tvragesync', 'DuckieTV.directives.serieheader', 'DuckieTV.directives.seriedetails', 'DuckieTV.directives.episodewatched'])

.controller('SerieCtrl',

    function(TheTVDB, ThePirateBay, FavoritesService, SettingsService, SceneNameResolver, TVRageSyncService, TraktTV, $routeParams, $scope, $rootScope, $injector, $filter) {
        console.log('Series controller!', $routeParams.serie, $scope, TheTVDB);
        $scope.episodes = [];
        $scope.points = [];

        $scope.markingAsWatched = false;
        $scope.markUntilDate = false;

        $scope.$on('favorites:updated', $scope.getSerie);
        $scope.$on('episodes:updated', $scope.getSerie);

        $scope.searching = false;
        var currentDate = new Date();


        $scope.getSerie = function() {
            FavoritesService.getById($routeParams.id).then(function(serie) {
                $scope.serie = serie.asObject();
                if (serie.get('fanart') != '') {
                    $rootScope.$broadcast('background:load', serie.get('fanart'));
                }

                var episodes = FavoritesService.getEpisodes(serie).then(function(data) {
                    $scope.episodes = data;
                    $scope.points = [];
                    $scope.labels = [];
                    data = $filter('orderBy')(data, $scope.getEpisodeNumber, false);
                    for (var i = 0; i < data.length; i++) {

                        var amt = parseFloat(data[i].rating);
                        if (isNaN(amt)) {
                            amt = 0;
                        }
                        if (amt <= 10) amt *= 10;
                        $scope.points.push({
                            x: i,
                            y: amt,
                            label: $scope.getEpisodeNumber(data[i]) + ' : ' + data[i].rating,
                            season: parseInt(data[i].seasonnumber, 10)
                        });
                    }
                    $scope.$digest();
                }, function(err) {
                    console.log("Could not find episodes for serie", err);
                });

            });
        }

        $scope.getSerie();

        /**
         * Check if airdate has passed
         */
        $scope.hasAired = function(serie) {
            return serie.firstaired && new Date(serie.firstaired) <= currentDate;
        };

        $scope.markRange = function(episode) {
            if (!$scope.markingAsWatched) return;
            $scope.markUntilDate = new Date(episode.firstaired)
            $scope.markingAsWatched = false;
            promiseQueue = null;
            for (var i = 0; i < $scope.episodes.length; i++) {
                if ($scope.episodes[i].firstaired != '' && new Date($scope.episodes[i].firstaired) <= $scope.markUntilDate) {
                    $scope.episodes[i].watched = '1';
                    $scope.episodes[i].watchedAt = new Date();

                    var p = CRUD.FindOne('Episode', {
                        ID: $scope.episodes[i].ID_Episode
                    }).then(function(epi) {
                        epi.set('watched', 1);
                        epi.set('watchedAt', new Date());
                        epi.Persist();
                    })
                }
                if (promiseQueue !== null) {
                    promiseQueue.then(function() {
                        return p;
                    });
                } else {
                    promiseQueue = p;
                }
            }
            if (promiseQueue) {
                promiseQueue.then(function() {
                    console.log("All markaswatched promises done!");
                    $rootScope.$broadcast('calendar:clearcache');
                });
            }
        }

        $scope.setMarkEnd = function(episode) {
            $scope.markUntilDate = new Date(episode.firstaired);
        }

        $scope.isMarkBeforeEnd = function(episode) {
            return $scope.markingAsWatched && $scope.markUntilDate >= new Date(episode.firstaired);
        }

        $scope.stopMarkingAsWatched = function() {
            $scope.markingAsWatched = false;
        }

        $scope.getSearchString = function(serie, episode) {
            var serieName = SceneNameResolver.getSceneName(serie.TVDB_ID) || serie.name;
            return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + $scope.getEpisodeNumber(episode) + ' ' + SettingsService.get('torrenting.searchquality');
        }

        $scope.getEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '0' + en : en].join('');
            return out;
        }

        $scope.tvRageSync = function(serie, episodes) {
            TVRageSyncService.syncEpisodes(serie, episodes);
        }

        $scope.traktSync = function(serie) {
            TraktTV.findSeriesByID(serie.TVDB_ID);
        }

        $scope.searchTorrents = function(serie, episode) {
            $scope.items = [];
            $scope.searching = true;
            var search = $scope.getSearchString(serie, episode);
            console.log("Search: ", search);
            $injector.get($scope.getSetting('torrenting.searchprovider')).search(search).then(function(results) {
                $scope.items = results;
                $scope.searching = false;
                console.log('Added episodes: ', $scope);
            }, function(e) {
                console.error("TPB search failed!");
                $scope.searching = false;
            });
        }

        $scope.markRangeWatchedStart = function() {
            $scope.markingAsWatched = true;
        }

    })