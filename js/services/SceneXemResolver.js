DuckieTV.
factory('SceneXemResolver', ["$q", "$http",
    function($q, $http) {
        var mappings = [],
            aliasmap = [],
            cache = {},
            logged = [],

            getXemCacheForSerie = function(tvdb_id) {
                if ((tvdb_id in cache)) {
                    return $q.resolve(cache[tvdb_id]);
                } else {
                    return $http.get('https://duckietv.github.io/xem-cache/' + tvdb_id + '.json').then(function(result) {
                        cache[tvdb_id] = result.data;
                        return result.data;
                    });
                }
            },

            isNotLogged = function(id) {
                var found = (logged.indexOf(id) > -1);
                if (!found) {
                    logged.push(id);
                }
                return !found;
            },

            formatAbsolute = function(absolute, fallback) {
                absolute = absolute || '';
                var abs = absolute.toString(),
                    out = (abs != '') ? (abs.length == 1) ? '0' + abs : abs : fallback;
                return out;
            };

        var service = {
            initialize: function() {
                if (!localStorage.getItem('1.1.5FetchFirstXemAliasMap')) {
                    console.info("Executing 1.1.5FetchFirstXemAliasMap");
                    localStorage.removeItem('xem.mappings');
                    localStorage.setItem('1.1.5FetchFirstXemAliasMap', new Date());
                    console.info("1.1.5FetchFirstXemAliasMap done!");
                }
                var lastFetched = ('xem.lastFetched' in localStorage) ? new Date(parseInt(localStorage.getItem('xem.lastFetched'))) : new Date();
                if (('xem.mappings' in localStorage) && lastFetched.getTime() + 86400000 > new Date().getTime()) {
                    mappings = JSON.parse(localStorage.getItem('xem.mappings'));
                    console.info("Fetched localstorage Xem series list: ", mappings);
                    aliasmap = JSON.parse(localStorage.getItem('xem.aliasmap'));
                    console.info("Fetched localstorage Xem series alias map:", aliasmap);
                } else {
                    $http.get('https://duckietv.github.io/xem-cache/mappings.json').then(function(response) {
                        mappings = response.data;
                        localStorage.setItem('xem.mappings', JSON.stringify(mappings));
                        localStorage.setItem('xem.lastFetched', new Date().getTime());
                        console.info("Updating localstorage Xem series list:", mappings);
                    });
                    $http.get('https://duckietv.github.io/xem-cache/aliasmap.json').then(function(response) {
                        aliasmap = response.data;
                        localStorage.setItem('xem.aliasmap', JSON.stringify(aliasmap));
                        console.info("Updating localstorage Xem series alias map:", aliasmap);
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
                            if (isNotLogged(serie.TVDB_ID.toString() + episode.getFormattedEpisode() + 'Y')) {
                                console.info("Xem has episode %s for %s (%s), using mapped format.", episode.getFormattedEpisode(), serie.name, serie.TVDB_ID, matches[0].scene);
                            }
                            if (serie.isAnime()) {
                                return $q.resolve(sceneName + formatAbsolute(matches[0].scene.absolute, episode.getFormattedEpisode()) + append);
                            } else {
                                return $q.resolve(sceneName + episode.formatEpisode(matches[0].scene.season, matches[0].scene.episode) + append);
                            }
                        } else {
                            if (isNotLogged(serie.TVDB_ID.toString() + episode.getFormattedEpisode() + 'N')) {
                                console.info("Xem does not have episode %s for %s (%s), using default format.", episode.getFormattedEpisode(), serie.name, serie.TVDB_ID);
                            }
                            if (serie.isAnime()) {
                                return $q.resolve(sceneName + formatAbsolute(episode.absolute, episode.getFormattedEpisode()) + append);
                            } else {
                                return $q.resolve(sceneName + episode.getFormattedEpisode() + append);
                            }
                        }
                    });
                } else {
                    if (isNotLogged(serie.TVDB_ID.toString())) {
                        console.info("Xem does not have series %s (%s), using default format.", serie.name, serie.TVDB_ID);
                    }
                    if (serie.isAnime()) {
                        return $q.resolve(sceneName + formatAbsolute(episode.absolute, episode.getFormattedEpisode()) + append);
                    } else {
                        return $q.resolve(sceneName + episode.getFormattedEpisode() + append);
                    }
                }
            },

            getXemAliasListForSerie: function(serie) {
                return (serie.TVDB_ID in aliasmap) ? aliasmap[serie.TVDB_ID] : [];
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
