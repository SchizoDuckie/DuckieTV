angular.module('DuckieTV.controllers.serie', ['DuckieTV.directives.serieheader', 'DuckieTV.directives.seriedetails', 'DuckieTV.directives.episodewatched'])

.controller('SerieCtrl',

    function(FavoritesService, SettingsService, SceneNameResolver, TraktTV, TorrentDialog, $routeParams, $scope, $rootScope, $injector, $filter, $q) {
        console.log('Series controller!', $routeParams.serie, $scope);
        $scope.episodes = [];
        $scope.episodeEntities = [];
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
            console.log("Set active season ", season);
            $scope.season = season.asObject();

            var episodes = season.getEpisodes().then(function(data) {
                $scope.episodes = data.map(function(el) {
                    $scope.episodeEntities[el.getID()] = el;
                    $scope.$on('magnet:select:' + el.get('TVDB_ID'), function(evt, magnet) {
                        console.debug("Found a magnet selected!", magnet);
                        this.set('magnetHash', magnet);
                        this.Persist();
                    }.bind(el));
                    return el.asObject();
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
                }
                $scope.$digest();
            }, function(err) {
                console.log("Could not find episodes for serie", err);
            }, function(err) {
                console.error("Error fetching latest season's episodes!", err);
            });
        }

        FavoritesService.getById($routeParams.id).then(function(serie) {
            $scope.serie = serie.asObject();
            $rootScope.$broadcast('serie:load', $scope.serie);

            if (serie.get('fanart') != '') {
                $rootScope.$broadcast('background:load', serie.get('fanart'));
            }
            serie.getSeasons().then(function(result) {
                allSeasons = result;
                $scope.seasons = result.map(function(el) {
                    return el.asObject()
                });
            });
            serie.getLatestSeason().then(function(result) {
                console.log("Got latest sesaon!", result);
                $scope.activeSeason = result;
                fetchEpisodes(result);
            });

        });

        $scope.$watch('activeSeason', function(newVal, old) {
            console.log("Active season changed!: ", newVal, old);
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
                    pq.push(CRUD.FindOne('Episode', {
                        ID: episode.ID_Episode
                    }).then(function(epi) {
                        epi.markWatched($rootScope).then(function(result) {
                            $scope.episodeEntities[result.get('ID_Episode')] = result;
                            $scope.episodes[index] = result.asObject();
                        });
                    }));
                }
            });

            $q.all(pq).then(function() {
                console.log("All markaswatched promises done!");
                $rootScope.$broadcast('calendar:clearcache');
            });

        };


        $scope.setMarkEnd = function(episode) {
            console.log("Set marker end: ", episode);
            $scope.markUntilIndex = episode.episodenumber;
        }

        $scope.isMarkBeforeEnd = function(episode) {
            return $scope.markingAsWatched && $scope.hasAired(episode) && parseInt($scope.markUntilIndex) >= parseInt(episode.episodenumber, 10);
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

        $scope.getSortEpisodeNumber = function(episode) {
            var sn = episode.seasonnumber.toString(),
                en = episode.episodenumber.toString(),
                out = ['S', sn.length == 1 ? '0' + sn : sn, 'E', en.length == 1 ? '00' + en : en.length == 2 ? '0' + en : en].join('');
            return out;
        }


        $scope.tvRageSync = function(serie, episodes) {
            TVRageSyncService.syncEpisodes(serie, episodes);
        }

        $scope.searchSeason = function(serie, season, $event) {
            TorrentDialog.search(serie.name + ' season ' + season.seasonnumber);
        }

        $scope.markRangeWatchedStart = function() {
            $scope.markingAsWatched = true;
        }

    })