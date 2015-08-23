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
                    console.info("Fetched Xem mappings from localstorage: ", mappings);
                } else {
                    console.info("Updating Xem mapping list.");
                    $http.get('https://duckietv.github.io/xem-cache/mappings.json').then(function(response) {
                        mappings = response.data;
                        localStorage.setItem('xem.mappings', JSON.stringify(mappings));
                        localStorage.setItem('xem.lastFetched', new Date().getTime());
                    });
                }
            },
            getEpisodeMapping: function(serie, episode, append) {
                if (mappings.indexOf(parseInt(serie.TVDB_ID)) > -1) {
                    return getXemCacheForSerie(serie.TVDB_ID).then(function(result) {
                        console.info("Fetched Xross Entity Mapping for %s", serie.name);
                        var matches = result.filter(function(show) {
                            return show.tvdb.season == episode.seasonnumber && show.tvdb.episode == episode.episodenumber;
                        });
                        if (matches.length > 0) {
                            console.warn("Returning Xross Entity Mapping mapping", matches[0].scene);
                            return episode.formatEpisode(matches[0].scene.season, matches[0].scene.episode) + append;
                        } else {
                            console.warn("Episode not fond in Xross Entity Map (TheXem.de). Returning default formatting.");
                            return episode.getFormattedEpisode() + append;
                        }
                    });
                } else {
                    console.info("returning default episode mapping from XEM because %s is not in the list", serie.TVDB_ID);
                    return $q.resolve(episode.getFormattedEpisode() + append);
                }
            }
        };

        return service;
    }
])

.run(["SettingsService", "SceneXemResolver",
    function(SettingsService, SceneXemResolver) {
        if (SettingsService.get('torrenting.enabled')) {
            console.info("Initializing Xross Scene Name Episode Mapping service");
            SceneXemResolver.initialize();
        }
    }
]);