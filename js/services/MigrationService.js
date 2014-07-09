angular.module('DuckieTV.providers.migrations', [])
.factory('MigrationService', function() {

  /*
   * REMINDER: background.js and launch.js have corresponding migration avoidance dependence
   */

  var service = {

    check: function() {
      // no migrations needed for this version
    }
  };

  return service;

})
