angular.module('SeriesGuide.providers',[])
/**
 * Persistent storage for favorites
 * Currently in localStorage, soon in SQLite 
 */
.factory('FavoritesService', function() {
  var service = {
    favorites : {},
    addFavorite: function(serie) {
    	this.favorites[serie.id] = serie;
    	this.save();
    },
    getById: function(id) {
    	return this.favorites[id];
    },
    save: function() {
      localStorage.favorites = angular.toJson(service.favorites);
    },
    restore: function() {
      service.favorites = angular.fromJson(localStorage.favorites) || {}
      return service.favorites;
    }
  };
  service.restore();
  return service;
})