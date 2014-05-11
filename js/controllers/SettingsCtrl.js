 angular.module('DuckieTV.controllers.settings', ['DuckieTV.providers.storagesync'])


 .controller('SettingsCtrl',
     function($scope, $location, $rootScope, FavoritesService, SettingsService, MirrorResolver, FileReader, TraktTV) {

         $scope.custommirror = SettingsService.get('thepiratebay.mirror');
         $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
         $scope.searchquality = SettingsService.get('torrenting.searchquality');
         $scope.mirrorStatus = [];
         $scope.log = [];
         $scope.hasTopSites = ('topSites' in window.chrome);

         $rootScope.$on('mirrorresolver:status', function(evt, status) {
             $scope.mirrorStatus.unshift(status);
         });

         $scope.sync = function() {
             console.log("Synchronizging!");
             $rootScope.$broadcast('storage:update');
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


         $scope.backupString = false;

         $scope.createBackup = function() {
             CRUD.EntityManager.getAdapter().db.execute('select Series.TVDB_ID from Series').then(function(series) {
                 var out = {
                     settings: {},
                     series: {}
                 };
                 for (var i = 0; i < localStorage.length; i++) {
                     if (localStorage.key(i).indexOf('database.version') > -1) continue;
                     out.settings[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
                 }
                 while (serie = series.next()) {
                     out.series[serie.get('TVDB_ID')] = [];
                 }

                 CRUD.EntityManager.getAdapter().db.execute('select Series.TVDB_ID, Episodes.TVDB_ID as epTVDB_ID, Episodes.watchedAt from Series left join Episodes on Episodes.ID_Serie = Series.ID_Serie where Episodes.watchedAt is not null').then(function(res) {
                     while (row = res.next()) {
                         out.series[row.get('TVDB_ID')].push({
                             'TVDB_ID': row.get('epTVDB_ID'),
                             'watchedAt': new Date(row.get('watchedAt')).getTime()
                         })
                     }
                     $scope.backupString = 'data:text/plain;charset=utf-8,' + encodeURIComponent(angular.toJson(out, true));
                     $scope.$digest();
                 });
             });
         }

         $scope.restore = function() {
             console.log("Restore backup!", $scope);
             FileReader.readAsText($scope.file, $scope)
                 .then(function(result) {
                     result = angular.fromJson(result);
                     console.log("Backup read!", result);
                     angular.forEach(result.settings, function(value, key) {
                         localStorage.setItem(key, value);
                     })
                     angular.forEach(result.series, function(watched, TVDB_ID) {
                         $scope.log.unshift('Reading backup item ' + TVDB_ID + ", has " + watched.length + " watched episodes");
                         TraktTV.enableBatchMode().findSerieByTVDBID(TVDB_ID).then(function(serie) {
                             $scope.log.unshift("Resolved TVDB serie: " + serie.title + ". Fetching all seasons and episodes");
                             FavoritesService.addFavorite(serie, watched).then(function() {
                                 $scope.log.unshift("Finished fetching all seasons and episodes for " + serie.title);
                                 $rootScope.$broadcast('storage:update');
                             });
                         });


                     });


                 }, function(err) {
                     console.error("ERROR!", err);
                 });
         }



         $scope.favorites = FavoritesService.favorites;
         $scope.$on('favorites:updated', function(event, data) {
             $rootScope.$broadcast('background:load', FavoritesService.favorites[Math.floor(Math.random() * FavoritesService.favorites.length)].fanart);

         });


     });