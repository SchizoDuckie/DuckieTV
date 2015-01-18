 angular.module('DuckieTV.controllers.trakttv', ['DuckieTV.providers.trakttvv2', 'DuckieTV.providers.settings', 'DuckieTV.providers.favorites'])

 .controller('TraktTVCtrl', function($scope, $rootScope, $q, TraktTVv2, FavoritesService, SettingsService) {

     $scope.credentials = {
         username: SettingsService.get('trakttv.username'),
         error: false
     };

     $scope.traktTVSeries = [];
     $scope.tvdbSeries = {};
     $scope.traktTVSuggestions = false;
     $scope.pushError = [false, null];
     $scope.suggestionError = [false, null];

     $scope.clearCredentials = function() {
         $scope.credentials.error = false;
         $rootScope.setSetting('trakttv.username', null);
     };

     $scope.isDownloaded = function(tvdb_id) {
         return tvdb_id in $scope.tvdbSeries;
     };

     $scope.getDownloaded = function(tvdb_id) {
         return $scope.tvdbSeries[tvdb_id];
     };

     $scope.countWatchedEpisodes = function(show) {
         var count = 0;
         show.seasons.map(function(s) {
             if (typeof s.episodes[0] == 'object') {
                 return;
             }
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
         TraktTVv2.getUserWatched($scope.credentials.username).then(function(data) {
             console.info("Found watched from Trakt.TV", data);
             data.map(function(show) {
                 $scope.traktTVSeries.push(show);
                 if (!(show.tvdb_id in $scope.tvdbSeries)) {
                     $scope.adding[show.tvdb_id] = true;

                     return TraktTVv2.serie(searchResult.slug_id).then(function(serie) {
                         $scope.tvdbSeries[show.tvdb_id] = serie;
                         return FavoritesService.addFavorite(serie);
                     }).then(function(serie) {
                         $scope.adding[show.tvdb_id] = false;
                         show.seasons.map(function(season) {
                             season.episodes.map(function(episode) {
                                 CRUD.FindOne('Episode', {
                                     seasonnumber: season.season,
                                     episodenumber: episode,
                                     'Serie': {
                                         TVDB_ID: show.tvdb_id
                                     }
                                 }).then(function(epi) {
                                     console.info("Episode marked as watched: ", serie.title, epi.getFormattedEpisode());
                                     epi.markWatched();
                                 });
                             });
                         });
                     });
                 }
             });
             $scope.traktTVSeries = data;
         }, function(err) {
             $scope.pushError = [true, err];
         });

         TraktTVv2.getUserShows($scope.credentials.username).then(function(data) {
             console.log("Found user shows from Trakt.tV", data);
             data.map(function(show) {
                 if ($scope.traktTVSeries.filter(function(el) {
                     return el.tvdb_id == show.tvdb_id;
                 }).length === 0) {
                     return TraktTVv2.serie(show.slug_id).then(function(serie) {
                         if (!(serie.tvdb_id in $scope.tvdbSeries)) {
                             $scope.tvdbSeries[show.tvdb_id] = serie;
                             return FavoritesService.addFavorite(serie);
                         }
                     });
                 }
             });
         });
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