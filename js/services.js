angular.module('SeriesGuide.providers',[])
/**
 * Persistent storage for favorites
 * 
 * Since it fetches asynchronously from sqlite it broadcasts a favorites:updated event
 * when data is done loading
 */
.factory('FavoritesService', function($rootScope) {
  var service = {
    favorites : [],
    addFavorite: function(data) {
    	this.favorites.push(data);
      var serie = new Serie();
      for(var i in data) {
        serie.set(i == 'id' ? 'TVDB_ID': i, data[i]);
      }

      serie.Persist().then(function(e) {
      }, function(fail) {
       console.log("Error persisting favorite!", data, arguments); 
     });
    },
    getById: function(id) {
    	var output = this.favorites.filter(function(elm) {
        console.log(elm, id);
        return elm['TVDB_ID'] == id;
      });
      return output.pop();
    },
    save: function() {
      localStorage.favorites = angular.toJson(service.favorites);
    },
    /**
     * Fetch stored series from sqlite and store them in service.favorites
     * Notify anyone listening by broadcasting favorites:updated 
     */
    restore: function() {
       CRUD.Find('Serie', {}).then(function(results) { 
            var favorites = [];
            for(var i=0; i<results.length; i++) {
                favorites.push(results[i].asObject());
            }
            service.favorites = favorites;
            $rootScope.$broadcast('favorites:updated',service);
        });
      }
  };
  service.restore();
  return service;
})