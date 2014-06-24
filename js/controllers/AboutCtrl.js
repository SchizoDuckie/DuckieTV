 angular.module('DuckieTV.controllers.about', [])

 .controller('AboutCtrl',function($scope, $rootScope, $q) {
    
    $scope.statistics = [];
    
    getStats = function() {
    
      // screen
      var screenSize = '';
      if (screen.width) {
         width = (screen.width) ? screen.width : '';
         height = (screen.height) ? screen.height : '';
         screenSize += '' + width + " x " + height;
      };

      getAllActiveTimers = function() {
          var deferred = $q.defer();
          chrome.alarms.getAll(function(result) {
              deferred.resolve(result);
          });
          return deferred.promise;
      };

      countTimers = function() {
          getAllActiveTimers().then(function(timers) {
              $scope.statistics.push({name: 'Timers', data: timers.length});
          });
      };

      countEntity = function(entity)  {
          CRUD.EntityManager.getAdapter().db.execute('select count(*) as count from ' + entity).then(  
              function(result) { 
                 $scope.statistics.push({name: "DB " + entity, data: result.next().row.count});
          });
      };

      $scope.statistics = [
           {name: chrome.app.getDetails().short_name,  data: chrome.app.getDetails().version},
           {name: 'UserAgent', data: navigator.userAgent},
           {name: 'Platform',  data: navigator.platform},
           {name: 'Vendor',    data: navigator.vendor},
           {name: 'Locale',    data: $rootScope.determinedLocale},
           {name: 'Screen',    data: screenSize}
      ];
      countTimers();
      countEntity('Series');
      countEntity('Seasons');
      countEntity('Episodes');
      countEntity('EventSchedule');
      
    }
    getStats();
});
