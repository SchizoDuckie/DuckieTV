angular.module('SeriesGuide.providers',['SeriesGuide.tvrage.sync'])
/**
 * Persistent storage for favorites
 * 
 * Since it fetches asynchronously from sqlite it broadcasts a favorites:updated event
 * when data is done loading
 */
.factory('FavoritesService', function($rootScope, TheTVDB, TVRageSyncService) {
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
          for(var prop in res.serie) {
            serie.set(prop, res.serie[prop]);
          }
          serie.Persist().then(function(res) {
            console.log("Serie update ok!", res);
            $rootScope.$broadcast('episodes:inserted', serie);
          }, function(err) {
            debugger;
          })
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
              var e = new Episode();
              e.changedValues = d;
              e.Persist(true).then(function(res) { } , function(err) { console.error("PERSIST ERROR!", err); debugger; })
            }
           }
           setTimeout(function() {
             TVRageSyncService.syncEpisodes(serie.asObject(), episodes);            
           }, 0);

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
    remove: function(serie) {
        console.log("Remove serie from favorites!", serie);
        var self = this;
        this.getById(serie['TVDB_ID']).then(function(serie) {
            serie.Find('Episode').then(function(episodes) {
            console.log("Found episodes for removal of serie!", episodes);
            for(var i=0; i<episodes.length; i++) {
              episodes[i].Delete().then(function() { console.log("Deleted OK!")}, function(err) { debugger; });
            }
            episodes = null;
            serie.Delete().then(function() {
              self.restore()
            });
          });
        })
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
            $rootScope.$broadcast('episodes:updated');
        });
      }
  };
  service.restore();
  return service;
})

.provider("NotificationService", function() {
  var ids = {};

  var create = function(options, callback) {
    var id = 'seriesguide_' + new Date().getTime();
    ids[id] = options;
    var notification = chrome.notifications.create(id, options, callback || function() {});
  }

  this.$get = function() {
    return {
      notify: function(title, message, callback) {
          create({
              type: "basic",
              title: title,
              message: message,
              iconUrl: "img/icon-magnet.png"
          });
      },
      list: function(title, message, items, callback) {
          create({
            type: "list",
            title: title,
            message: message,
            iconUrl: "img/icon-magnet.png",
            items: items
          });
          
      } 
    }
  };
})
/*

.provider("EventScheduleService", function(EventWatcherService) {
  var ids = {};

  function alarmHandler(event) {
    console.log('An alarm has fired! ', event);
    EventWatcherService.onEvent(event);
  }

 
  this.$get = function() {
    return {
      get: function(title) {
          chrome.alarms.get(title, 
      },
      getAll: function(title, message, items, callback) {
          create({
            type: "list",
            title: title,
            message: message,
            iconUrl: "img/icon-magnet.png",
            items: items
          });
          
      },
      create: function(alarm) {

      },
      clear: function(event) {
        chrome.alarms.clear(event);
        return event.Delete();
      },
      clearAll: function() {
        chrome.alarms.clearAll();
      }
    }
  };
})


.provider("EventWatcherService", function($rootScope) {
  
  this.$get = function() {
    return {
      onEvent: function(event) {
        console.log("Event was fired!", event);
        // $alarm = getScheduledEventByName(eventName);
        $rootScope.$broadcast(alarm.get('eventchannel'), alarm.get('data'))
        debugger;
      }
    }
  };
})

.provider('EpisodeAiredService', function() {

  $rootScope.$on('episode:aired', function(episode) {
    // fetch services that check for aired episode releases
    // fetch config for quality
    // resolve provider to check for download
    // cancel alarm when needed

  }

  this.$get = function() {
    return {}
  }

})


.provider('WatchListCheckerService', function() {

  $rootScope.$on('watchlist:check', function(episode) {
    // fetch services that check for aired episode releases
    // fetch config for quality
    // resolve provider to check for download
    // cancel alarm when needed

  }

  this.$get = function() {
    return {}
  }

})

.provider('PirateBayCheckerService', function(NotificationService, ThePirateBay) {

  //  $rootScope.$on()
  this.$get = function() {
    return {};

  }




})
*/