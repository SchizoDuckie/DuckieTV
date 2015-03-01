/**
 * The EpisodeAiredService checks if a download is availabe for a TV-Show that's aired
 * and automatically downloads the first search result if more than minSeeders seeders are available.
 *
 * Runs in the background page.
 */
DuckieTV.factory('EpisodeAiredService', ["$rootScope", "FavoritesService", "SceneNameResolver", "SettingsService", "GenericSearch", "TorrentDialog", "uTorrent",
    function($rootScope, FavoritesService, SceneNameResolver, SettingsService, GenericSearch, TorrentDialog, uTorrent) {

        var period = SettingsService.get('autodownload.period'); // Period to check for updates up until today current time, default 7
        var minSeeders = SettingsService.get('autodownload.minSeeders'); // Minimum amount of seeders required, default 250

        var service = {
            attach: function() {
                console.info('Initializing episode aired checker service!');
                $rootScope.$on('episode:aired:check', function() {
                    console.log("Episode air check fired");

                    var from = new Date(); // Create a date for the from range period
                    from.setDate(from.getDate() - period);
                    from.setHours(0);
                    from.setMinutes(0);
                    from.setSeconds(0);

                    uTorrent.AutoConnect().then(function(remote) {
                        console.log("Utorrent connected: ", remote);
                        // Get the list of episodes that have aired since period, and iterate them.
                        FavoritesService.getEpisodesForDateRange(from.getTime(), new Date().getTime()).then(function(candidates) {
                            candidates.map(function(episode, episodeIndex) {
                                if (episode.watchedAt !== null) return; // if the episode has been marked as watched, skip it.
                                if (episode.magnetHash !== null && (episode.magnetHash in remote.torrents)) return; // if the episode was already downloaded, skip it.
                                //if (episode.downloaded !== null) return; // if the episode was already downloaded, skip it.

                                CRUD.FindOne('Serie', {
                                    ID_Serie: episode.get('ID_Serie')
                                }).then(function(serie) {
                                    service.autoDownload(serie, episode, episodeIndex).then(function(result) {
                                        if (result) {
                                            // store the magnet hash on the episode and notify the listeners of the change
                                            $rootScope.$broadcast('magnet:select:' + episode.TVDB_ID, [result]);
                                        }
                                    });
                                });
                            });
                        });
                    });
                    setTimeout(function() {
                        $rootScope.$broadcast('episode:aired:check');
                    }, 60 * 60 * 2 * 1000);
                });
            },
            autoDownload: function(serie, episode, episodeIndex) {
                // Fetch the Scene Name for the serie and compile the search string for the episode with the quality requirement.
                var name = SceneNameResolver.getSceneName(serie.get('TVDB_ID')) || serie.get('name');
                var searchString = name.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + episode.getFormattedEpisode() + ' ' + $rootScope.getSetting('torrenting.searchquality');
                console.log("Auto download!", searchString);

                // Search torrent provider for the string
                return GenericSearch.search(searchString, true).then(function(results) {
                    if (results.length === 0) {
                        return; // no results, abort
                    }
                    if (parseInt(results[0].seeders, 10) >= minSeeders) { // enough seeders are available.
                        var url = results[0].magneturl;
                        // launch the magnet uri via the TorrentDialog's launchMagnet Method
                        uTorrent.AutoConnect().then(function() {
                            TorrentDialog.launchMagnet(url, serie.get('TVDB_ID'), true);
                            episode.magnetHash = url.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase();
                            episode.Persist();
                        })

                        return url.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase();
                    }
                });
            }
        };

        return service;
    }
])

/**
 * Attach autodownload check interval when enabled.
 */
.run(function($rootScope, EpisodeAiredService, SettingsService) {

    EpisodeAiredService.attach();
    if (SettingsService.get('torrenting.autodownload') === true) {
        setTimeout(function() {
            $rootScope.$broadcast('episode:aired:check');
        }, 1000);
    }
})