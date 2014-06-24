 angular.module('DuckieTV.controllers.settings', ['DuckieTV.providers.storagesync'])


 .controller('SettingsCtrl',
     function($scope, $location, $rootScope, FavoritesService, SettingsService, MirrorResolver, TraktTV, $translate, tmhDynamicLocale) {

         $scope.custommirror = SettingsService.get('thepiratebay.mirror');
         $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
         $scope.searchquality = SettingsService.get('torrenting.searchquality');
         $scope.bgopacity = SettingsService.get('background-rotator.opacity');
         $scope.mirrorStatus = [];
         $scope.log = [];
         $scope.hasTopSites = ('topSites' in window.chrome);
         $scope.locale = SettingsService.get('locale');

         $scope.activesettings = ('templates/settings/default.html');

         $scope.setActiveSetting = function(setting) {
             console.log("setting active setting", setting)
             $scope.activesettings = ('templates/settings/' + setting + '.html');
         }

         $rootScope.$on('mirrorresolver:status', function(evt, status) {
             $scope.mirrorStatus.unshift(status);
         });

         $scope.sync = function() {
             console.log("Synchronizging!");
             $rootScope.$broadcast('storage:update');
         }

         $scope.setLocale = function(id) {
             console.log("Setting locale: ", id);
             $rootScope.setSetting('locale', id);
             $scope.locale = id;
             // load and activate replacement translation table 
             $translate.use(id);
             tmhDynamicLocale.set(id);
         }

         $scope.setSearchProvider = function(provider) {
             $scope.searchprovider = provider;
             SettingsService.set('torrenting.searchprovider', provider);
         }

         $scope.setSearchQuality = function(quality) {
             console.log("Setting searchquality: ", quality);
             $rootScope.setSetting('torrenting.searchquality', quality);
             $scope.searchquality = quality;
         }

         $scope.setBGOpacity = function(opacity) {
             console.log("Setting Background Opacity: ", opacity);
             $rootScope.setSetting('background-rotator.opacity', opacity);
             $scope.bgopacity = opacity;
         }

         $scope.findRandomTPBMirror = function() {
             MirrorResolver.findTPBMirror().then(function(result) {
                 $scope.custommirror = result;
                 SettingsService.set('thepiratebay.mirror', $scope.custommirror);
                 $rootScope.$broadcast('mirrorresolver:status', 'Saved!');
             }, function(err) {
                 console.debug("Could not find a working TPB mirror!", err);
             })
         }

         $scope.validateCustomMirror = function(mirror) {
             $scope.mirrorStatus = [];
             MirrorResolver.verifyMirror(mirror).then(function(result) {
                 $scope.custommirror = result;
                 SettingsService.set('thepiratebay.mirror', $scope.custommirror);
                 $rootScope.$broadcast('mirrorresolver:status', 'Saved!');
             }, function(err) {
                 console.log("Could not validate custom mirror!", mirror);
                 //$scope.customMirror = '';
             })
         }


         $scope.favorites = FavoritesService.favorites;
         $scope.$on('favorites:updated', function(event, data) {
             $rootScope.$broadcast('background:load', FavoritesService.favorites[Math.floor(Math.random() * FavoritesService.favorites.length)].fanart);

         });


     });
