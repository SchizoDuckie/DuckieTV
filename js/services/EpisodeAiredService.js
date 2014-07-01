angular.module('DuckieTV.providers.episodeaired', [])

.factory('EpisodeAiredService', function($rootScope) {

    var service = {
        initialize: function() {
            console.log('initializing episode aired checker service!');
            $rootScope.$on('episode:aired:check', function(episode) {
                console.log("Episode air check fired");
                // fetch a list of episodes aired from <configurable period in days in the past> until today that have no magnetLink yet
                // fetch config for quality
                // resolve provider to check for download
                // if a torrent is found with <configurable amount of seeders minimum> launch it's magnet uri
                // set the magnetUri on the episode
                // notify the calendar

            });
        }
    }
    service.initialize();
    return service;
});