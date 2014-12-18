angular.module('DuckieTV.providers.episodeaired', ['DuckieTV.providers.favorites', 'DuckieTV.providers.scenenames', 'DuckieTV.directives.torrentdialog'])


/**
 * The EpisodeAiredService checks if a download is availabe for a TV-Show that's aired
 * and automatically downloads the first search result if more than minSeeders seeders are available.
 *
 * Runs in the background page.
 */
.factory('EpisodeAiredService', function($rootScope, FavoritesService, SceneNameResolver, SettingsService, $injector, TorrentDialog) {
    var period = 7; // period to check for updates up until today current time
    var minSeeders = 250; // minimum amount of seeders required.

    var service = {
        attach: function() {
            console.log('initializing episode aired checker service!');
            $rootScope.$on('episode:aired:check', function(episode) {
                console.log("Episode air check fired");

                var from = new Date(); // create a date for the from range period
                from.setDate(from.getDate() - period);
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);

                // Get the list of episodes that have aired since period, and iterate them.
                FavoritesService.getEpisodesForDateRange(from.getTime(), new Date().getTime()).then(function(candidates) {
                    candidates.map(function(episode, episodeIndex) {
                        if (episode.get('watchedAt') !== null) return; // if the episode has been marked as watched, skip it.
                        if (episode.get('magnetHash') !== null) return; // if the episode already has a magnetHash, skip it.

                        CRUD.FindOne('Serie', {
                            ID_Serie: episode.get('ID_Serie')
                        }).then(function(serie) {
                            service.autoDownload(serie, episode, episodeIndex);
                        });

                    });
                });
            });
        },
        autoDownload: function(serie, episode, episodeIndex) {
            // fetch the Scene Name for the serie and compile the search string for the episode with the quality requirement.
            var name = SceneNameResolver.getSceneName(serie.get('TVDB_ID')) || serie.get('name');
            var searchString = name.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + episode.getFormattedEpisode() + ' ' + $rootScope.getSetting('torrenting.searchquality');
            var SearchProvider = $injector.get(SettingsService.get('torrenting.searchprovider'));
            SearchProvider.search(searchString).then(function(results) { // search torrent provider for the string
                if (results.length === 0) {
                    return; // no results, abort
                }
                if (parseInt(results[0].seeders, 10) >= minSeeders) { // enough seeders are available.
                    var url = results[0].magneturl; // launch the magnet uri via the TorrentDialog's launchMagnet Method
                    setTimeout(function() {
                        TorrentDialog.launchMagnet(url, serie.get('TVDB_ID'), true);
                    }, (episodeIndex || 0) * 10000);
                    // store the magnet hash on the episode and notify the listeners of the change

                    $rootScope.$broadcast('magnet:select:' + episode.TVDB_ID, [url.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase()]);
                }
            });
        }
    };
    return service;
});