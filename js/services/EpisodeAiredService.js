/**
 * The EpisodeAiredService checks if a download is availabe for a TV-Show that's aired
 * and automatically downloads the first search result if more than minSeeders seeders are available.
 *
 * Runs in the background page.
 */
DuckieTV

.factory('EpisodeAiredService', ["$rootScope", "FavoritesService", "SceneNameResolver", "SettingsService", "TorrentSearchEngines", "DuckieTorrent", "TorrentHashListService",
    function($rootScope, FavoritesService, SceneNameResolver, SettingsService, TorrentSearchEngines, DuckieTorrent, TorrentHashListService) {

        var period = SettingsService.get('autodownload.period'); // Period to check for updates up until today current time, default 1
        var minSeeders = SettingsService.get('autodownload.minSeeders'); // Minimum amount of seeders required, default 50

        var service = {
            checkTimeout: null,
            autoDownloadCheck: function() {
                //console.debug("Episode air check fired");
                if (SettingsService.get('torrenting.autodownload') === false) {
                    service.detach();
                    return;
                }

                var lastRun = SettingsService.get('autodownload.lastrun'),
                    from = new Date();
                if (lastRun) {
                    from = new Date(lastRun);
                }
                from.setDate(from.getDate() - period); // substract autodownload period from lastrun for if some episodes weren't downloaded.
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);

                DuckieTorrent.getClient().AutoConnect().then(function(remote) {
                    console.info(DuckieTorrent.getClientName() + " connected: ", remote);
                    // Get the list of episodes that have aired since period, and iterate them.
                    FavoritesService.getEpisodesForDateRange(from.getTime(), new Date().getTime()).then(function(candidates) {
                        candidates.map(function(episode, episodeIndex) {
                            if (episode.isDownloaded()) return; // if the episode was already downloaded, skip it.
                            if (episode.watchedAt !== null) return; // if the episode has been marked as watched, skip it.
                            if (episode.magnetHash !== null && (episode.magnetHash in remote.torrents)) return; // if the episode was already downloaded, skip it.

                            CRUD.FindOne('Serie', {
                                ID_Serie: episode.ID_Serie
                            }).then(function(serie) {
                                service.autoDownload(serie, episode, episodeIndex).then(function(result) {
                                    if (result) {
                                        // store the magnet hash on the episode and notify the listeners of the change
                                        $rootScope.$broadcast('magnet:select:' + episode.TVDB_ID, [result]);
                                    }
                                });
                            });
                        });
                        SettingsService.set('autodownload.lastrun', new Date().getTime());
                    });
                });
                service.checkTimeout = setTimeout(service.autoDownloadCheck, 60 * 60 * 2 * 1000);
            },

            autoDownload: function(serie, episode, episodeIndex) {
                // Fetch the Scene Name for the serie and compile the search string for the episode with the quality requirement.
                var searchString = SceneNameResolver.getSceneName(serie.TVDB_ID,serie.name) + ' ' + episode.getFormattedEpisode() + ' ' + $rootScope.getSetting('torrenting.searchquality');
                //console.debug("Auto download!", searchString);

                // Search torrent provider for the string
                return TorrentSearchEngines.getDefaultEngine().search(searchString, true).then(function(results) {
                    if (results.length === 0) {
                        return; // no results, abort
                    }
                    if (results[0].seeders == 'N/A' || parseInt(results[0].seeders, 10) >= minSeeders) { // enough seeders are available.
                        var url = results[0].magneturl;
                        var torrentHash = url.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase();
                        // launch the magnet uri via the TorrentSearchEngines's launchMagnet Method
                        DuckieTorrent.getClient().AutoConnect().then(function() {
                            TorrentSearchEngines.launchMagnet(url, serie.TVDB_ID, true);
                            episode.magnetHash = torrentHash;
                            episode.Persist();
                            // record that this magnet was launched under DuckieTV's control. Used by auto-Stop.
                            TorrentHashListService.addToHashList(torrentHash);
                        })
                        return torrentHash;
                    }
                });
            },
            attach: function() {
                if (!service.checkTimeout) {
                    service.checkTimeout = setTimeout(service.autoDownloadCheck, 5000);
                }
            },
            detach: function() {
                clearTimeout(service.checkTimeout);
                service.checkTimeout = null;
            }
        };
        return service;
    }
])

/**
 * Attach auto-download check interval when enabled.
 */
.run(["$rootScope", "EpisodeAiredService", "SettingsService",
    function($rootScope, EpisodeAiredService, SettingsService) {

        if (SettingsService.get('torrenting.enabled') === true && SettingsService.get('torrenting.autodownload') === true) {
            setTimeout(function() {
                console.info('Initializing episode aired checker service!');
                EpisodeAiredService.attach();
            }, 5000);
        }
    }
])