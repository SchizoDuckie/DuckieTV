 angular.module('DuckieTV.controllers.trakttv', [])

 .controller('TraktTVCtrl', function($scope, $rootScope, TraktTV, FavoritesService) {

     $scope.credentials = {
         username: 'schizoduckie',
         password: null,
         passwordHash: null
     };

     $scope.traktTVSeries = null;
     $scope.tvdbSeries = {};

     $scope.encryptPassword = function() {
         if ($scope.credentials.password !== null) {
             $scope.credentials.passwordHash = CryptoJS.SHA1($scope.credentials.password).toString();
             $scope.credentials.password = angular.copy($scope.credentials.passwordHash);
         }
     }

     $scope.isDownloaded = function(tvdb_id) {
         return tvdb_id in $scope.tvdbSeries;
     }

     $scope.getDownloaded = function(tvdb_id) {
         return $scope.tvdbSeries[tvdb_id];
     }

     $scope.readTraktTV = function() {
         TraktTV.getUserShows($scope.credentials.username).then(function(data) {
             console.log("Found series from Trakt.tV", data);
             data.map(function(show) {
                 TraktTV.findSerieByTVDBID(show.tvdb_id).then(function(show) {
                     $scope.tvdbSeries[show.tvdb_id] = show;
                 });
             });
             $scope.traktTVSeries = data;
         });
     }

 });