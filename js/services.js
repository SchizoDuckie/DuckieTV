angular.module('DuckieTV.providers',['DuckieTV.tvrage.sync'])
/**
 * Persistent storage for favorites
 * 
 * Since it fetches asynchronously from sqlite it broadcasts a favorites:updated event
 * when data is done loading
 */
.factory('FavoritesService', function($rootScope, TheTVDB, TVRageSyncService, $q) {
  var service = {
    favorites : [],
    addFavorite: function(data) {
      var d = $q.defer(), serie = new Serie();

      for(var i in data) {
        serie.set(i == 'id' ? 'TVDB_ID': i, data[i]);
      }
      serie.Persist().then(function(e) {
          service.favorites.push(serie.asObject());
          $rootScope.$broadcast('favorites:updated',service);
          TheTVDB.findEpisodes(serie.get('TVDB_ID')).then(function(res) { 
            service.updateEpisodes(serie.get('TVDB_ID'), res.episodes);
            for(var prop in res.serie) {
              serie.set(prop, res.serie[prop]);
            }
            serie.Persist().then(function(res) {
              $rootScope.$broadcast('episodes:inserted', serie);
              d.resolve();
            }, function(err) {
              d.reject();
            })
        }); 
      }, function(fail) {
       console.log("Error persisting favorite!", data, arguments); 
      });
      return d.promise;
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
             TVRageSyncService.syncEpisodes(serie.asObject(), episodes, $rootScope);            
           }, 0);

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
              $rootScope.$broadcast('storage:update');
              self.restore()
            });
          });
        })
    },
    getSeries: function() {
      var d = $q.defer();
     CRUD.Find('Serie', {}).then(function(results) { 
          var favorites = [];
          for(var i=0; i<results.length; i++) {
              favorites.push(results[i].asObject());
          }
          d.resolve(favorites);
      });
      return d.promise;
    },

    /**
     * Fetch stored series from sqlite and store them in service.favorites
     * Notify anyone listening by broadcasting favorites:updated 
     */
    restore: function() {
      service.getSeries().then(function(results) {
        service.favorites = results;
        $rootScope.$broadcast('favorites:updated',service);
        $rootScope.$broadcast('episodes:updated');
      });
    }
  };
  service.restore();
  return service;
})


.factory('SettingsService', function(StorageSyncService) {
  var service = {
    settings : {},
    defaults: {
      'topSites.enabled' : true,
      'torrenting.enabled': true,
      'torrenting.searchprovider' : 'ThePirateBay',
      'torrenting.searchbox' : true,
      'torrenting.searchquality' : '',
      'thepiratebay.mirror' : 'https://thepiratebay.se',
      'series.displaymode' : 'poster',
      'calendar.large': false,
      'storage.sync': true
    },

    get: function(key) {
      return ((key in service.settings) ? service.settings[key] : (key in service.defaults) ? service.defaults[key] : false);
    },

    set: function(key, value) {
      service.settings[key] = value;
      service.persist();
    },

    persist: function() {
      localStorage.setItem('userPreferences', angular.toJson(service.settings,true));
    },
    
    /**
     * Fetch stored series from sqlite and store them in service.favorites
     * Notify anyone listening by broadcasting favorites:updated 
     */
    restore: function() {
      if(!localStorage.getItem('userPreferences')) {
        service.defaults['topSites.enabled'] = ('topSites' in (window.chrome));
        service.settings = service.defaults;
      } else {
        service.settings = angular.fromJson(localStorage.getItem('userPreferences'));   
      }
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


.factory('WatchlistService', function($rootScope, IMDB) {
  var service = {
    watchlist : [],

    add: function(data) {
        console.log("Add!", data);
        var watchlistitem = new WatchListItem();
        watchlistitem.set('searchstring', data.title );
        console.log("Saving!", watchlistitem);
        watchlistitem.Persist().then(function(e) {

          var obj = new WatchListObject();
          obj.set('property', 'imdb');
          obj.set('json', angular.toJson(data, true));
          obj.set('ID_WatchListItem', watchlistitem.get('ID_WatchListItem'));
          obj.Persist().then(function(obj) {
           service.restore();
          }, function(err) { debugger; }) 
        }, function(fail) {
         console.log("Error persisting watchlistitem!", data, arguments); 
       });
       

    },
    getById: function(id) {
       return CRUD.FindOne('WatchListItem', { 'ID_WatchlistItem' : id});
    },
    remove: function(watchlistitem) {
        console.log("Remove watchlistitem from watchlist!", watchlistitem);
        var self = this;
        this.getById(watchlistitem['ID_WatchListItem']).then(function(watchlistitem) {
          watchlistitem.Delete().then(function() {
             self.restore()
          });
        });
       
    },
    /**
     * Fetch stored watchlistitems from sqlite and store them in service.watchlist
     * Notify anyone listening by broadcasting watchlist:updated 
     */
    restore: function() {
      console.log("restoring watchlist!");
       CRUD.Find('WatchListItem').then(function(results) { 
            console.log("Fetched watchlist results: ", results);
            var watchlist = [];
            results.map(function(result) {
              CRUD.Find('WatchListObject', { 'ID_WatchListItem': result.get('ID_WatchListItem')}).then(function(props) {

                var item = result.asObject();
                for(var j=0; j< props.length; j++) {
                  item[props[j].get('property')] = angular.fromJson(props[j].get('json'));
                }
                watchlist.push(item);
                if(watchlist.length == results.length) {
                  console.log("Watchlist done!", watchlist.length, results.length, watchlist);
                  service.watchlist = watchlist;
                  $rootScope.$broadcast('watchlist:updated',service.watchlist);
                }
              })
            }, function(err) {
                console.log("Error fetching watchlist", err);
            });

        });
     }
   };
    service.restore();
    return service;

})