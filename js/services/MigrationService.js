angular.module('DuckieTV.providers.migrations', [])
.factory('MigrationService', function() {

  var service = {

    check: function() {
      // no migrations needed for this version
    }
  };

  return service;

})
