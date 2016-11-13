/**
 * Fanart API v3 service
 * docs: http://docs.fanarttv.apiary.io/#
 */
DuckieTV.factory('FanartService', ["$q", "$http", function($q, $http) {
        var endpoint = 'http://webservice.fanart.tv/v3/tv/';
        var API_KEY = "mæ¶ën|{W´íïtßg½÷¾6mÍ9Õýß";

        var cache = {};

        function getUrl(tvdb_id) {
            return [endpoint, tvdb_id, '?api_key=', btoa(API_KEY)].join('');
        }

        function storeInDB(json) {
            var art = new Fanart();
            art.TVDB_ID = json.thetvdb_id;
            art.json = json;
            art.poster = service.getTrendingPoster(json);
            return art.Persist().then(function(obj){
                console.log("Fanartstoredindb", obj);
                return art;
            })
        }

        var service = {
            initialize: function() {
            
            },
            get: function(tvdb_id) {
                return CRUD.FindOne('Fanart', { TVDB_ID: tvdb_id}).then(function(result) {
                    if(result) {
                        return result;
                    } else {
                         return $http.get(getUrl(tvdb_id)).then(function(result) {
                            return storeInDB(result.data);
                        }, function(err) {
                            console.error('Could not load fanart', err);
                            return false;
                        });   
                    }
                }, function(err) {
                    console.error('Could not load fanart', err);
                    
                })
            },
            getTrendingPoster: function(fanart) {
                //console.debug('fanart.getTrendingPoster', fanart);
                if (!fanart) {
                    return null;
                }
                if (!('tvposter' in fanart) && !('clearlogo' in fanart) && ('hdtvlogo' in fanart)) {
                    return fanart.hdtvlogo[0].url.replace('/fanart','/preview');
                }
                if (!('tvposter' in fanart) && ('clearlogo' in fanart)) {
                    return fanart.clearlogo[0].url.replace('/fanart','/preview');
                }
                if ('tvposter' in fanart) {
                    return fanart.tvposter[0].url.replace('/fanart','/preview');
                }

                return null;
            },
            getSeasonPoster: function(seasonnumber, fanart) {
                //console.debug('fanart.getSeasonPoster', seasonnumber, fanart);
                if (!fanart) {
                    return null;
                }
                if(('seasonposter' in fanart)) {
                    var hit = fanart.seasonposter.filter(function(image) {
                        return parseInt(image.season) == parseInt(seasonnumber);
                    });
                    if(hit && hit.length > 0) {
                        return hit[0].url;
                    }
                }
                if(('tvposter' in fanart)) {
                    return fanart.tvposter[0].url.replace('/fanart','/preview');
                }

                return null;
            },
            getEpisodePoster: function(fanart) {
                //console.debug('fanart.getEpisodePoster', fanart);
                if (!fanart) {
                    return null;
                }
                if(('tvthumb' in fanart)) {
                    return fanart.tvthumb[0].url;
                }
                if('hdtvlogo' in fanart) {
                    return fanart.hdtvlogo[0].url;
                }
                return null;
            },
            store: function() {
                localStorage.setItem('fanart.cache', JSON.stringify(cache));
            },
            restore: function() {
                if(localStorage.getItem('fanart.cache')) {
                    console.info('Loading localStorage fanart.cache');
                    cache = JSON.parse(localStorage.getItem('fanart.cache'));
                    console.log("Unserialized cache: ", cache);
                    Object.keys(cache).map(function(tvdb_id) {
                        storeInDB(cache[tvdb_id]);
                    });
                    localStorage.removeItem('fanart.cache');
                } 
                if(!localStorage.getItem("fanart.bootstrapped")) {
                    console.info('Loading file fanart.cache.json');
                    $http.get('fanart.cache.json').then(function(result) {
                        return Promise.all(Object.keys(result.data).map(function(tvdb_id) {
                            return storeInDB(result.data[tvdb_id]);
                        }));
                    }).then(function() {
                     localStorage.setItem('fanart.bootstrapped',1);
                       console.log("Fanart bootstrap cache filled"); 
                    });
                }
            }
        };
        service.restore();
        return service;
    }
]);
