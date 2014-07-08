angular.module('DuckieTV.providers.migrations', [])
.factory('MigrationService', function() {

  /*
   * REMINDER: background.js has corresponding migration avoidance dependants
   */

  var service = {

    check: function() {
      // no migrations needed for this version
    }
  };

  return service;

})
