angular.module('SeriesGuide.providers',[])
/**
 * Persistent storage for favorites
 * 
 * Since it fetches asynchronously from sqlite it broadcasts a favorites:updated event
 * when data is done loading
 */
.factory('FavoritesService', function($rootScope, TheTVDB) {
  var service = {
    favorites : [],
    addFavorite: function(data) {
      var serie = new Serie();
      for(var i in data) {
        serie.set(i == 'id' ? 'TVDB_ID': i, data[i]);
      }
      serie.Persist().then(function(e) {
        this.favorites.push(serie.asObject());
         $rootScope.$broadcast('favorites:updated',service);
        // this.updateEpisodes(serie.get('TVDB_ID'));
      }.bind(this), function(fail) {
       console.log("Error persisting favorite!", data, arguments); 
     });

    },
    updateEpisodes: function(serieID, episodes) {
        console.log("---> Update episode: ", serieID, episodes);
        CRUD.FindOne(Serie, { 'TVDB_ID': serieID }).then(function(serie) {
        serie.getEpisodes().then(function(data) {
           var cache = {};
           for(var i=0; i<data.length; i++) {
              cache[data[i].get('TVDB_ID')] = data[i];
           }
           console.log('cache! ', cache);
           for(var j = 0; j< episodes.length; j++) {
           if(!(episodes[j].id in cache)) {
              var d = episodes[j];
              d['TVDB_ID'] = d.id;
              delete d.id;
              d['ID_Serie'] = serie.getID();
                console.log("Episode saving! ", d);
           
              var e = new Episode();
              e.changedValues = d;
              e.Persist(true).then(function(res) { console.log("persisted ok!", res, d) } , function(err) { console.error("PERSIT ERROR!", err); debugger; })
            }
           }

        });
        
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