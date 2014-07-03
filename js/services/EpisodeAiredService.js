angular.module('DuckieTV.providers.episodeaired', ['DuckieTV.providers.favorites', 'DuckieTV.providers.scenenames', 'DuckieTV.providers.thepiratebay', 'DuckieTV.directives.torrentdialog'])

.factory('EpisodeAiredService', function($rootScope, FavoritesService, SceneNameResolver, ThePirateBay, TorrentDialog, $rootScope) {
    var period = 2; // period to check for updates up until today current time
    var minSeeders = 250;

    var service = {
        initialize: function() {
            console.log('initializing episode aired checker service!');
            $rootScope.$on('episode:aired:check', function(episode) {
                console.log("Episode air check fired");
                var from = new Date(); // create a date for the from range period
                from.setDate(from.getDate() - period);
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                FavoritesService.getEpisodesForDateRange(from.getTime(), new Date().getTime()).then(function(candidates) {
                    candidates.map(function(episode, episodeIndex) {
                        //if (episode.get('watchedAt') !== null) return;
                        //if (episode.get('magnetHash') !== null) return;

                        CRUD.FindOne('Serie', {
                            ID_Serie: episode.get('ID_Serie')
                        }).then(function(serie) {
                            var name = SceneNameResolver.getSceneName(serie.get('TVDB_ID'));
                            var searchString = (name || serie.get('name')) + ' ' + episode.getFormattedEpisode() + ' ' + $rootScope.getSetting('torrenting.searchquality');
                            ThePirateBay.search(searchString).then(function(results) {
                                if (results.length == 0) {
                                    return;
                                }
                                if (parseInt(results[0].seeders, 10) >= minSeeders) {
                                    var url = results[0].magneturl;
                                    setTimeout(function() {
                                        TorrentDialog.magnetSelect(url, serie.get('TVDB_ID'), true);
                                    }, episodeIndex * 10000)
                                    episode.set('magnetHash', url.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
                                    episode.Persist();
                                    $rootScope.$broadcast('episodes:updated');
                                }
                            })

                        })

                    });
                })
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