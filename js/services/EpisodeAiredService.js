angular.module('DuckieTV.providers.episodeaired', ['DuckieTV.providers.favorites', 'DuckieTV.providers.scenenames', 'DuckieTV.providers.thepiratebay', 'DuckieTV.directives.torrentdialog'])

.factory('EpisodeAiredService', function($rootScope, FavoritesService, SceneNameResolver, ThePirateBay, TorrentDialog, $q, $rootScope) {
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
                var prom = null;
                console.log("Get episodes from : ", from.toISOString().split('T')[0], 'until', new Date().toISOString().split('T'));
                FavoritesService.getEpisodesForDateRange(from.getTime(), new Date().getTime()).then(function(candidates) {
                    var pq = [];
                    candidates.map(function(episode) {
                        var p = $q.defer();
                        if (episode.get('watchedAt') !== null) return;
                        //if (episode.get('magnetHash') !== null) return;

                        CRUD.FindOne('Serie', {
                            ID_Serie: episode.get('ID_Serie')
                        }).then(function(serie) {
                            var name = SceneNameResolver.getSceneName(serie.get('TVDB_ID'));
                            var searchString = (name || serie.get('name')) + ' ' + episode.getFormattedEpisode() + ' ' + $rootScope.getSetting('torrenting.searchquality');
                            console.log("Update check candidate: ", searchString);
                            ThePirateBay.search(searchString).then(function(results) {
                                if (results.length == 0) {
                                    p.resolve(); // nothing to do here
                                }
                                if (parseInt(results[0].seeders, 10) >= minSeeders) {
                                    console.log("Download candidates found! for ", serie.get('name'), episode.getFormattedEpisode(), " \\o/", results[0]);
                                    if (!prom) {
                                        prom = TorrentDialog.magnetSelect(results[0].magneturl, serie.get('TVDB_ID'), true);
                                    } else {
                                        prom.then(function() {
                                            return TorrentDialog.magnetSelect(results[0].magneturl, serie.get('TVDB_ID'), true);
                                        })
                                    }
                                    episode.set('magnetHash', results[0].magneturl.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
                                    episode.Persist();
                                    $rootScope.$broadcast('episodes:updated');
                                }
                            })

                        })
                        pq.push(p.promise);
                    });
                    console.log("Promise queue: ", pq);
                    $q.all(pq);
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