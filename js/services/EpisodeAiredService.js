angular.module('DuckieTV.providers.episodeaired', [])

.factory('EpisodeAiredService', function($rootScope) {

    var service = {
        initialize: function() {
            $rootScope.$on('episode:aired', function(episode) {
                // fetch services that check for aired episode releases
                // fetch config for quality
                // resolve provider to check for download
                // cancel alarm when needed

            });
        }
    }
    //service.initialize;
    return service;
});