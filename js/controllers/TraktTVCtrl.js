 angular.module('DuckieTV.controllers.trakttv', [])

 .controller('TraktTVCtrl', function($scope, $rootScope, TraktTV, FavoritesService, SettingsService) {

     $scope.credentials = {
         username: SettingsService.get('trakttv.username'),
         password: SettingsService.get('trakttv.passwordHash'),
         passwordHash: SettingsService.get('trakttv.passwordHash')
     };

     $scope.traktTVSeries = [];
     $scope.tvdbSeries = {};
     $scope.traktTVSuggestions = false;

     $scope.encryptPassword = function() {
         if ($scope.credentials.password !== null) {
             $scope.credentials.passwordHash = CryptoJS.SHA1($scope.credentials.password).toString();
             $scope.credentials.password = angular.copy($scope.credentials.passwordHash);
             $rootScope.setSetting('trakttv.passwordHash', $scope.credentials.passwordHash);
             $rootScope.setSetting('trakttv.username', $scope.credentials.username);
         }
     };

     $scope.clearCredentials = function() {
        $scope.credentials.passwordHash = $scope.credentials.password = $scope.credentials.username = null;
        $rootScope.setSetting('trakttv.passwordHash', null);
        $rootScope.setSetting('trakttv.username', null);

     }

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

     $scope.getUserSuggestions = function() {
         $scope.traktTVLoading = true;
         TraktTV.getUserSuggestions().then(function(data) {
             console.log("Found user suggestions from Trakt.tV", data);
             $scope.traktTVSuggestions = data;
             $scope.traktTVLoading = false;
         });
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

     $scope.pushToTraktTV = function() {
        var serieIDs = {};
           
        FavoritesService.favorites.map(function(serie) {
            console.log("Adding serie to trakt.tv: ", serie);
            TraktTV.addToLibrary(serie.TVDB_ID);
            serieIDs[serie.ID_Serie] = serie.TVDB_ID;
        });

        CRUD.Find('Episode', {'watched': '1'}, { limit: '100000'}).then(function(episodes) {
            episodes.map(function(episode) {
                //console.log("marking episode watched: ", episode.get('ID_Serie'), episode.get('TVDB_ID'));
                TraktTV.markEpisodeWatched(serieIDs[episode.get('ID_Serie')], episode);    
            });

        });
     }

 });