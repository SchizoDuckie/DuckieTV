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
      var that = this;
      serie.Persist().then(function(e) {
        that.favorites.push(serie.asObject());
         $rootScope.$broadcast('favorites:updated',service);
         TheTVDB.findEpisodes(serie.get('TVDB_ID')).then(function(res) { 
          that.updateEpisodes(serie.get('TVDB_ID'), res.episodes);
        }); 
        
      }, function(fail) {
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
           console.log('cache! ', cache, episodes);
           for(var j = 0; j< episodes.length; j++) {
           if(!(episodes[j].id in cache)) {
              var d = episodes[j];
              d['TVDB_ID'] = d.id;
              delete d.id;
              d['ID_Serie'] = serie.getID();
                console.log("Episode saving! ", d);
           
              var e = new Episode();
              e.changedValues = d;
              e.Persist(true).then(function(res) { console.log("persisted ok!", res, d) } , function(err) { console.error("PERSIST ERROR!", err); debugger; })
            }
           }

        }).then(function(data) {
             $rootScope.$broadcast('episodes:updated');
        });
        
      });
      
    },
    getEpisodes: function(serie, filters) {
      serie = serie instanceof CRUD.Entity ? serie : this.getById(serie);
      return serie.Find('Episode', filters || {}).then(function(episodes) {
      return episodes.map(function(val, id) { return val.asObject() });
      }, function(err) { console.log("Error in getepisodes!", serie, filters || {}); });
    },
    getEpisodesForDateRange: function(start, end) {
      return CRUD.Find('Episode', [ 'firstaired > "'+start +'" AND firstaired < "'+end+'"' ]).then(function(ret) { return ret; })
    },
    getById: function(id) {
    	 return CRUD.FindOne('Serie', { 'TVDB_ID' : id});
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