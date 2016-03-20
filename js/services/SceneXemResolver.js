DuckieTV.
factory('SceneXemResolver', ["$q", "$http",
    function($q, $http) {
        var mappings = [],
            cache = {},
            getXemCacheForSerie = function(tvdb_id) {
                if ((tvdb_id in cache)) {
                    return $q.resolve(cache[tvdb_id]);
                } else {
                    return $http.get('https://duckietv.github.io/xem-cache/' + tvdb_id + '.json').then(function(result) {
                        cache[tvdb_id] = result.data;
                        return result.data;
                    });
                }

            };

        var service = {
            initialize: function() {
                var lastFetched = ('xem.lastFetched' in localStorage) ? new Date(parseInt(localStorage.getItem('xem.lastFetched'))) : new Date();
                if (('xem.mappings' in localStorage) && lastFetched.getTime() + 86400000 > new Date().getTime()) {
                    mappings = JSON.parse(localStorage.getItem('xem.mappings'));
                    console.info("Fetched localstorage Xem series list: ", mappings);
                } else {
                    $http.get('https://duckietv.github.io/xem-cache/mappings.json').then(function(response) {
                        mappings = response.data;
                        localStorage.setItem('xem.mappings', JSON.stringify(mappings));
                        localStorage.setItem('xem.lastFetched', new Date().getTime());
                        console.info("Updating localstorage Xem series list:", mappings);
                    });
                }
            },
            getEpisodeMapping: function(serie, episode, sceneName, append) {
                if (mappings.indexOf(parseInt(serie.TVDB_ID)) > -1) {
                    return getXemCacheForSerie(serie.TVDB_ID).then(function(result) {
                        var matches = result.filter(function(show) {
                            return show.tvdb.season == episode.seasonnumber && show.tvdb.episode == episode.episodenumber;
                        });
                        if (matches.length > 0) {
                            console.info("Xem has episode for %s (%s), using mapped format.", serie.name, serie.TVDB_ID, matches[0].scene);
                            return sceneName + episode.formatEpisode(matches[0].scene.season, matches[0].scene.episode) + append;
                        } else {
                            console.info("Xem does not have episode for %s (%s), using default format.", serie.name, serie.TVDB_ID);
                            return sceneName + episode.getFormattedEpisode() + append;
                        }
                    });
                } else {
                    console.info("Xem does not have series %s (%s), using default format.", serie.name, serie.TVDB_ID);
                    return $q.resolve(sceneName + episode.getFormattedEpisode() + append);
                }
            }
        };

        return service;
    }
])

.run(["SettingsService", "SceneXemResolver",
    function(SettingsService, SceneXemResolver) {
        if (SettingsService.get('torrenting.enabled')) {
            console.info("Initializing Xross Entity Mapping (http://thexem.de/) service for Scene Name episode format.");
            SceneXemResolver.initialize();
        }
    }
]);
