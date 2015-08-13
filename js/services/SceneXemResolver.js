DuckieTV.
factory('SceneXemResolver', ["$q", "$http",
    function($q, $http) {
        var mappings = localStorage.getItem('xem.mappings');

        if (mappings) {
            mappings = JSON.parse(mappings);
        } else {
            $http.get('https://duckietv.github.io/xem-cache/mappings.json').then(function(response) {
                mappings = response.data;
                localStorage.setItem('xem.mappings', JSON.stringify(mappings));
                localStorage.setItem('xem.lastFetched', new Date().getTime());
            });
        }

        var service = {
            getEpisodeMapping: function(serie, episode) {
                if (mappings.indexOf(serie.TVDB_ID.toString()) > -1) {
                    return $http.get('https://duckietv.github.io/xem-cache/' + serie.TVDB_ID + '.json').then(function(result) {
                        var matches = result.data.filter(function(show) {
                            return show.tvdb.season == episode.seasonnumber && show.tvdb.episode == episode.episodenumber;
                        });
                        if (matches.length > 0) {
                            return 'S' + matches[0].scene.season + 'E' + matches[0].scene.episode;
                        } else {
                            console.warn("Episode not fond in Xross Entity Map (TheXem.de). Returning default formatting.");
                            return episode.getFormattedEpisode();
                        }
                    });
                } else {
                    return $q.resolve(episode.getFormattedEpisode());
                }
            }


        };

        return service;
    }
]);