DuckieTV.factory('FanartService', ["$q", "$http", function($q, $http) {
        var endpoint = 'http://webservice.fanart.tv/v3/tv/';
        var API_KEY = "mæ¶ën|{W´íïtßg½÷¾6mÍ9Õýß";

        var cache = {};

        function getUrl(tvdb_id) {
            return [endpoint, tvdb_id, '?api_key=', btoa(API_KEY)].join('');
        }


        var service = {
            initialize: function() {
            
            },
            get: function(tvdb_id) {
                return $q(function(resolve, reject) {
                    if((tvdb_id in cache)) {
                        console.debug('Using cache', cache[tvdb_id].name);
                        return resolve(cache[tvdb_id]);
                    }
                    return $http.get(getUrl(tvdb_id)).then(function(result) {
                        console.debug('Fetched', result.data.name, result.data);
                        cache[tvdb_id] = result.data;
                        service.store();
                        resolve(result.data);
                    });    
                })  
            },
            getSeasonPoster: function(seasonnumber, fanart) {
                if(('seasonposter' in fanart)) {
                    var hit = fanart.seasonposter.filter(function(image) {
                        return parseInt(image.season) == parseInt(seasonnumber);
                    });
                    if(hit && hit.length > 0) {
                        return hit[0].url;
                    }
                }
                if(('tvposter' in fanart)) {
                    return fanart.tvposter[0].url.replace('/fanart','/preview')
                }

                return null;
            },
            getEpisodePoster: function(fanart) {
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
                    cache = JSON.parse(localStorage.getItem('fanart.cache'));
                }
            }
        };
        service.restore();
        return service;
    }
]);
