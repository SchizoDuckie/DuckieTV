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
                if (mappings.indexOf(serie.TVDB_ID) > -1) {
                    return $http.get('https://duckietv.github.io/xem-cache/' + serie.TVDB_ID + '.json').then(function(result) {

                        debugger;
                    });
                } else {
                    return $q.resolve(episode.getFormattedEpisode());
                }
            }


        };

        return service;
    }
]);