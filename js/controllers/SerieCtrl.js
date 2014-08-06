angular.module('DuckieTV.controllers.serie', ['DuckieTV.directives.serieheader', 'DuckieTV.directives.seriedetails', 'DuckieTV.directives.episodewatched'])

.controller('SerieCtrl',

    function(FavoritesService, SettingsService, SceneNameResolver, TraktTV, TorrentDialog, $routeParams, $scope, $rootScope, $injector, $filter, $q, $locale) {
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
        var daysOfWeekWords = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ]; // used by translateDayOfWeek()
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

        function fetchEpisodes(season) {
            if (!season) return;
            $scope.season = season.asObject();

            var episodes = season.getEpisodes().then(function(data) {
                $scope.episodes = data.map(function(el) {
                    $scope.episodeEntities[el.getID()] = el;
                    $scope.$on('magnet:select:' + el.get('TVDB_ID'), function(evt, magnet) {
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
                };
                $scope.$digest();
            }, function(err) {
                console.log("Could not find episodes for serie", err);
            }, function(err) {
                console.error("Error fetching latest season's episodes!", err);
            });
        };

        FavoritesService.getById($routeParams.id).then(function(serie) {
            $scope.serie = serie.asObject();
            $rootScope.$broadcast('serie:load', $scope.serie);

            if (serie.get('fanart') != '') {
                $rootScope.$broadcast('background:load', serie.get('fanart'));
            };
            serie.getSeasons().then(function(result) {
                allSeasons = result;
                $scope.seasons = result.map(function(el) {
                    return el.asObject()
                });
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
                    pq.push(CRUD.FindOne('Episode', {
                        ID: episode.ID_Episode
                    }).then(function(epi) {
                        epi.markWatched($rootScope).then(function(result) {
                            $scope.episodeEntities[result.get('ID_Episode')] = result;
                            $scope.episodes[index] = result.asObject();
                        });
                    }));
                };
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
            return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + $scope.getEpisodeNumber(episode) + ' ' + SettingsService.get('torrenting.searchquality');
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

        $scope.translateDayOfWeek = function(dayofweek) {
            /*
             * takes the English day of the week (as fetched from TrakTV) and returns a translation
             */
            return $locale.DATETIME_FORMATS.DAY[daysOfWeekWords.indexOf(dayofweek)];
        };

        $scope.translateGenre = function(genre) {
            /*
             * takes the English genre (as fetched from TrakTV) and returns a translation 
             */
            return (genreList.indexOf(genre) != -1) ? translatedGenreList[genreList.indexOf(genre)] : genre;
        };
    })