 angular.module('DuckieTV.controllers.trakttv', [])

 .controller('TraktTVCtrl', function($scope, $rootScope, TraktTV, FavoritesService) {

     $scope.credentials = {
         username: 'schizoduckie',
         password: null,
         passwordHash: null
     }

     $scope.encryptPassword = function() {
         if ($scope.credentials.password !== null) {
             $scope.credentials.passwordHash = CryptoJS.SHA1($scope.credentials.password).toString();
             $scope.credentials.password = angular.copy($scope.credentials.passwordHash);
         }
     }

 });