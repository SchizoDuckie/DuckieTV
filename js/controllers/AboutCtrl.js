 angular.module('DuckieTV.controllers.about', [])

 .controller('AboutCtrl', function($scope, $rootScope, $q, $http, EventSchedulerService, SettingsService) {

     $scope.statistics = [];

     getStats = function() {

         // screen
         var screenSize = '';
         if (screen.width) {
             width = (screen.width) ? screen.width : '';
             height = (screen.height) ? screen.height : '';
             screenSize += '' + width + " x " + height;
         };

         countTimers = function() {
             EventSchedulerService.getAll().then(function(timers) {
                 $scope.statistics.push({
                     name: 'Timers',
                     data: timers.length
                 });
             });
         };

         countEntity = function(entity) {
             CRUD.EntityManager.getAdapter().db.execute('select count(*) as count from ' + entity).then(
                 function(result) {
                     $scope.statistics.push({
                         name: "DB " + entity,
                         data: result.next().row.count
                     });
                 });
         };


         $scope.statistics = [{
             name: 'UserAgent',
             data: navigator.userAgent
         }, {
             name: 'Platform',
             data: navigator.platform
         }, {
             name: 'Vendor',
             data: navigator.vendor
         }, {
             name: 'Determined Locale',
             data: SettingsService.get('client.determinedlocale')
         }, {
             name: 'Active Locale',
             data: SettingsService.get('application.locale')
         }, {
             name: 'Active Language',
             data: SettingsService.get('application.language')
         }, {
             name: 'Screen',
             data: screenSize
         }, {
             name: 'ChromeCast Supported',
             data: SettingsService.get('cast.supported')
         }, {
             name: 'Storage Sync',
             data: SettingsService.get('storage.sync')
         }, {
             name: 'Torrenting',
             data: SettingsService.get('torrenting.enabled')
         }, {
             name: 'TrakTV Sync',
             data: SettingsService.get('trakttv.sync')
         }];

         if ('chrome' in window && 'app' in window.chrome && 'GetDetails' in chrome.app && 'version' in window.chrome.app.getDetails()) {
             $scope.statistics.unshift({
                 name: window.chrome.app.getDetails().short_name,
                 data: window.chrome.app.getDetails().version
             });
         } else {
             $http({
                 method: 'GET',
                 url: 'VERSION'
             }).
             success(function(data, status, headers, config) {
                 $scope.statistics.unshift({
                     name: 'DuckieTV webbased',
                     data: data
                 });
             });
         }

         countTimers();
         countEntity('Series');
         countEntity('Seasons');
         countEntity('Episodes');
         countEntity('EventSchedule');

     }
     getStats();
 });