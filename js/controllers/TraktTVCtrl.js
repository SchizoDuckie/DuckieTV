 angular.module('DuckieTV.controllers.trakttv', [])

 .controller('TraktTVCtrl', function($scope, $rootScope, TraktTV, TraktTVv2, FavoritesService, SettingsService) {

     $scope.credentials = {
         username: SettingsService.get('trakttv.username'),
         password: SettingsService.get('trakttv.passwordHash'),
         passwordHash: SettingsService.get('trakttv.passwordHash'),
         temphash: null,
         error: false
     };

     $scope.traktTVSeries = [];
     $scope.tvdbSeries = {};
     $scope.traktTVSuggestions = false;
     $scope.pushError = [false, null];
     $scope.suggestionError = [false, null];

     $scope.TestV2Api = function() {
         TraktTVv2.watched();
     };

     $scope.encryptPassword = function() {
         if ($scope.credentials.password !== null) {
             // Use Temp Password so that the trakt page doesn't update (it relies on passwordHash being null)
             $scope.credentials.temphash = CryptoJS.SHA1($scope.credentials.password).toString();
             // Check account details (user / sha1 pass) with Trakt.TV
             TraktTV.checkDetails($scope.credentials.username, $scope.credentials.temphash).then(function(response) {
                 if (response == 'success') {
                     // Update internal values and save passwords in settings
                     $scope.credentials.passwordHash = $scope.credentials.temphash;
                     $scope.credentials.password = angular.copy($scope.credentials.passwordHash);
                     $rootScope.setSetting('trakttv.passwordHash', $scope.credentials.passwordHash);
                     $rootScope.setSetting('trakttv.username', $scope.credentials.username);
                     $scope.credentials.error = false;
                 } else {
                     $scope.credentials.error = true;
                     $scope.credentials.passwordHash = $scope.credentials.password = $scope.credentials.username = $scope.credentials.temphash = null;
                 }
             });
         }
     };

     $scope.clearCredentials = function() {
         $scope.credentials.passwordHash = $scope.credentials.password = $scope.credentials.username = $scope.credentials.temphash = null;
         $scope.credentials.error = false;
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
         //console.log("Counting watched episodes for ", show, count);
         return count;
     };

     $scope.getUserSuggestions = function() {
         $scope.traktTVLoading = true;
         TraktTV.getUserSuggestions().then(function(data) {
             console.info("Found user suggestions from Trakt.tv", data);
             $scope.traktTVSuggestions = data;
             $scope.traktTVLoading = false;
         }, function(err) {
             $scope.suggestionError = [true, err];
         });
     };

     $scope.readTraktTV = function() {
         TraktTV.enableBatchMode().getUserWatched($scope.credentials.username).then(function(data) {
             console.info("Found watched from Trakt.TV", data);
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
                                         console.info("Episode marked as watched: ", serie.title, epi.getFormattedEpisode());
                                         epi.markWatched();
                                     });
                                 });
                             });
                         });
                     });
                 }
             });
             $scope.traktTVSeries = data;
         }, function(err) {
             $scope.pushError = [true, err]
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
             console.log("Adding serie '" + serie.name + "' to Trakt.tv: ", serie);
             TraktTV.addToLibrary(serie.TVDB_ID);
             serieIDs[serie.ID_Serie] = serie.TVDB_ID;
         });

         CRUD.Find('Episode', {
             'watched': '1'
         }, {
             limit: '100000'
         }).then(function(episodes) {
             episodes.map(function(episode) {
                 //console.log("marking episode watched: ", episode.get('ID_Serie'), episode.get('TVDB_ID'));
                 TraktTV.markEpisodeWatched(serieIDs[episode.get('ID_Serie')], episode);
             });

         });
     }

 });