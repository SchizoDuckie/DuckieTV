 angular.module('DuckieTV.controllers.trakttv', [])

 .controller('TraktTVCtrl', function($scope, $rootScope, TraktTV, FavoritesService, SettingsService) {

     $scope.credentials = {
         username: SettingsService.get('trakttv.username'),
         password: SettingsService.get('trakttv.passwordHash'),
         passwordHash: SettingsService.get('trakttv.passwordHash')
     };

     $scope.traktTVSeries = [];
     $scope.tvdbSeries = {};

     $scope.encryptPassword = function() {
         if ($scope.credentials.password !== null) {
             $scope.credentials.passwordHash = CryptoJS.SHA1($scope.credentials.password).toString();
             $scope.credentials.password = angular.copy($scope.credentials.passwordHash);
             $rootScope.setSetting('trakttv.passwordHash', $scope.credentials.passwordHash);
             $rootScope.setSetting('trakttv.username', $scope.credentials.username);
         }
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
         console.log("Countin watched episode sfor ", show, count);
         return count;
     };

     $scope.readTraktTV = function() {
         TraktTV.enableBatchMode().getUserWatched($scope.credentials.username).then(function(data) {
             console.log("Found watched from Trakt.TV", data);
             data.map(function(show) {
                 $scope.traktTVSeries.push(show);
                 if (!(show.tvdb_id in $scope.tvdbSeries)) {
                     $scope.adding[show.tvdb_id] = true;
                     TraktTV.findSerieByTVDBID(show.tvdb_id).then(function(serie) {
                         $scope.tvdbSeries[show.tvdb_id] = serie;
                         FavoritesService.addFavorite(serie).then(function() {
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
                                         console.log("Episode marked as watched: ", serie.title, epi.getFormattedEpisode());
                                         epi.markWatched();
                                     });
                                 });
                             });
                         });
                     });
                 }
             });
             $scope.traktTVSeries = data;
         });

         TraktTV.getUserShows($scope.credentials.username).then(function(data) {
             console.log("Found user shows from Trakt.tV", data);
             data.map(function(show) {
                 if ($scope.traktTVSeries.filter(function(el) {
                     return el.tvdb_id == show.tvdb_id;
                 }).length === 0) {
                     TraktTV.findSerieByTVDBID(show.tvdb_id).then(function(serie) {
                         $scope.traktTVSeries.push(serie);
                         if (!(show.tvdb_id in $scope.tvdbSeries)) {
                             $scope.tvdbSeries[show.tvdb_id] = serie;
                             FavoritesService.addFavorite(serie);
                         }
                     });
                 }

             });

         });
     };

 });