 angular.module('DuckieTV.controllers.trakttv', ['DuckieTV.providers.trakttvv2', 'DuckieTV.providers.settings', 'DuckieTV.providers.favorites'])

 .controller('TraktTVCtrl', function($scope, $rootScope, $q, TraktTVv2, FavoritesService, SettingsService) {

     $scope.credentials = {
         username: localStorage.getItem('trakt.username') || '',
         error: false,
         success: localStorage.getItem('trakt.token') || false
     };

     $scope.traktTVSeries = [];
     $scope.localSeries = {};
     $scope.adding = {};
     $scope.traktTVSuggestions = false;
     $scope.pushError = [false, null];
     $scope.suggestionError = [false, null];

     $scope.clearCredentials = function() {
         $scope.credentials.error = false;
         localStorage.removeItem('trakt.token');
     };

     $scope.authorize = function(username, password) {
         return TraktTVv2.login(username, password).then(function(result) {
             $scope.credentials.success = result;
             $scope.credentials.error = false;
         }, function(result) {
             $scope.credentials.success = false;
             $scope.credentials.password = '';
             $scope.credentials.error = result;
         });
     };

     $scope.isDownloaded = function(tvdb_id) {
         return tvdb_id in $scope.localSeries;
     };

     $scope.getDownloaded = function(tvdb_id) {
         return $scope.localSeries[tvdb_id];
     };

     $scope.isAdded = function(tvdb_id) {
         return ((tvdb_id in $scope.adding) && ($scope.adding[tvdb_id] === false));
     };

     $scope.isAdding = function(tvdb_id) {
         return ((tvdb_id in $scope.adding) && ($scope.adding[tvdb_id] === true));
     };


     $scope.countWatchedEpisodes = function(show) {
         if (!show.seasons) return 0;
         var count = 0;
         show.seasons.map(function(s) {
             count += s.episodes.length;
         });
         //console.log("Counting watched episodes for ", show, count);
         return count;
     };

     $scope.getUserSuggestions = function() {
         $scope.traktTVLoading = true;
         TraktTVv2.getUserSuggestions().then(function(data) {
             console.info("Found user suggestions from Trakt.tv", data);
             $scope.traktTVSuggestions = data;
             $scope.traktTVLoading = false;
         }, function(err) {
             $scope.suggestionError = [true, err];
         });
     };

     $scope.readTraktTV = function() {
         FavoritesService.getSeries().then(function(series) {
             series.map(function(serie) {
                 $scope.localSeries[serie.TVDB_ID] = serie;
             });
         })
         // fetch all watched shows

         .then(TraktTVv2.watched).then(function(shows) {
             console.info("Found watched from Trakt.TV", shows);
             Promise.all(shows.map(function(show) {
                 $scope.traktTVSeries.push(show);
                 // flag it as added if we already cached it.
                 if ((show.tvdb_id in $scope.localSeries)) {
                     $scope.adding[show.tvdb_id] = false;
                 } else if (!(show.tvdb_id in $scope.localSeries)) {
                     // otherwise add to favorites, show spinner.
                     $scope.adding[show.tvdb_id] = true;
                     return TraktTVv2.serie(show.slug_id).then(function(serie) {
                         return FavoritesService.addFavorite(serie).then(function(s) {
                             $scope.localSeries[s.tvdb_id] = s;
                         });
                     }).then(function(serie) {
                         $scope.adding[show.tvdb_id] = false;
                         return serie;
                     });
                 }
             })).then(function() {
                 // process seasons and episodes marked as watched.
                 return Promise.all(shows.map(function(show) {
                     $scope.adding[show.tvdb_id] = true;
                     return Promise.all(show.seasons.map(function(season) {
                         return Promise.all(season.episodes.map(function(episode) {
                             return CRUD.FindOne('Episode', {
                                 seasonnumber: season.number,
                                 episodenumber: episode.number,
                                 'Serie': {
                                     TVDB_ID: show.tvdb_id
                                 }
                             }).then(function(epi) {
                                 if (!epi) {
                                     console.log("Episode not found", season.number, 'e', episode.number, ' for ', show.name);
                                 } else {
                                     console.info("Episode marked as watched: ", show.name, epi.getFormattedEpisode());
                                     return epi.markWatched();
                                 }
                             });
                         }));
                     })).then(function() {
                         $scope.adding[show.tvdb_id] = false;
                     });
                 }));

             });
         })


         // user shows times out for me still too often to test proerly
         .then(TraktTVv2.usershows().then(function(data) {
             console.log("Found user shows from Trakt.tV", data);
             data.map(function(show) {
                 $scope.traktTVSeries.push(show);

                 if (!(show.tvdb_id in $scope.localSeries)) {
                     $scope.adding[show.tvdb_id] = true;
                     return TraktTVv2.serie(show.slug_id).then(function(serie) {
                         return FavoritesService.addFavorite(serie).then(function(s) {
                             $scope.localSeries[s.tvdb_id] = s;
                         });
                     }).then(function() {
                         $scope.adding[show.tvdb_id] = false;
                     });

                 } else {
                     $scope.adding[show.tvdb_id] = false;
                 }
             });
         }));

     };

     $scope.pushToTraktTV = function() {
         var serieIDs = {};

         FavoritesService.favorites.map(function(serie) {
             console.log("Adding serie '" + serie.name + "' to Trakt.tv: ", serie);
             TraktTVv2.addToLibrary(serie.TVDB_ID);
             serieIDs[serie.ID_Serie] = serie.TVDB_ID;
         });

         CRUD.Find('Episode', {
             'watched': '1'
         }, {
             limit: '100000'
         }).then(function(episodes) {
             episodes.map(function(episode) {
                 //console.log("marking episode watched: ", episode.get('ID_Serie'), episode.get('TVDB_ID'));
                 TraktTVv2.markEpisodeWatched(serieIDs[episode.get('ID_Serie')], episode);
             });

         });
     };

 });