/**
 * The AutoDownloadService checks if a download is available for a TV-Show that's aired
 * and automatically downloads the first search result if more than minSeeders seeders are available.
 *
 */
DuckieTV

.factory('AutoDownloadService', ["$rootScope", "FavoritesService", "SceneNameResolver", "SettingsService", "TorrentSearchEngines", "DuckieTorrent", "TorrentHashListService",
    function($rootScope, FavoritesService, SceneNameResolver, SettingsService, TorrentSearchEngines, DuckieTorrent, TorrentHashListService) {

        var service = {
            checkTimeout: null,
            activityList: [],
            fromDT: null,
            toDT: null,

            activityUpdate: function(serie, search, status, extra) {
                var csm = 0;
                var csmExtra = ''; 
                if (serie.customSearchSizeMin && serie.customSearchSizeMin != null) {
                    csm = 1;
                    csmExtra = ' (' + serie.customSearchSizeMin.toString() + '/';
                } else {
                    csmExtra = ' (-/';
                }
                if (serie.customSearchSizeMax && serie.customSearchSizeMax != null) {
                    csm = 1;
                    csmExtra = csmExtra + serie.customSearchSizeMax.toString() + ')';
                } else {
                    csmExtra = csmExtra + '-)';
                }
                if (csm == 0) {
                    csmExtra = '';
                }
                var css = (serie.customSearchString && serie.customSearchString != '') ? 1 : 0;
                var sp = (serie.searchProvider && serie.searchProvider != null) ? ' (' + serie.searchProvider + ')' : '';
                service.activityList.push({'search': search, 'searchProvider': sp, 'csmExtra': csmExtra, 'csm': csm,  'css': css, 'igq': serie.ignoreGlobalQuality, 'igi': serie.ignoreGlobalIncludes, 'ige': serie.ignoreGlobalExcludes, 'status': status, 'extra': extra});
                $rootScope.$broadcast('autodownload:activity');
            },

            autoDownloadCheck: function() {
                if (SettingsService.get('torrenting.autodownload') === false) {
                    service.detach();
                    return;
                }

                service.activityList = [];
                var period = SettingsService.get('autodownload.period'); // Period to check for updates up until today current time, default 1
                var lastRun = SettingsService.get('autodownload.lastrun'),
                    from = new Date();
                if (lastRun) {
                    from = new Date(lastRun);
                }
                from.setDate(from.getDate() - period); // subtract autodownload period from lastrun for if some episodes weren't downloaded.
                from.setHours(0);
                from.setMinutes(0);
                from.setSeconds(0);
                service.toDT = new Date().getTime();
                service.fromDT = from.getTime();               
                $rootScope.$broadcast('autodownload:activity');

                if (DuckieTorrent.getClient().isConnected()) {
                    DuckieTorrent.getClient().AutoConnect().then(function(remote) {
                        // Get the list of episodes that have aired since period, and iterate them.
                        FavoritesService.getEpisodesForDateRange(service.fromDT, service.toDT).then(function(candidates) {
                            candidates.map(function(episode) {
                                CRUD.FindOne('Serie', {
                                    ID_Serie: episode.ID_Serie
                                }).then(function(serie) {
                                    var serieEpisode = serie.name + ' ' + episode.getFormattedEpisode();
                                    if (episode.isDownloaded()) {
                                            service.activityUpdate(serie, serieEpisode, 0); // 'downloaded'
                                        return; // if the episode was already downloaded, skip it.
                                    };
                                    if (episode.watchedAt !== null) {
                                            service.activityUpdate(serie, serieEpisode, 1); // 'watched'
                                        return; // if the episode has been marked as watched, skip it.
                                    };
                                    if (episode.magnetHash !== null && (episode.magnetHash in remote.torrents)) {
                                            service.activityUpdate(serie, serieEpisode, 2); // 'has magnet'
                                        return; // if the episode already has a magnet, skip it.
                                    };

                                    if (serie.autoDownload == 1) {
                                        service.autoDownload(serie, episode).then(function(result) {
                                            if (result) {
                                                // store the magnet hash on the episode and notify the listeners of the change
                                                $rootScope.$broadcast('magnet:select:' + episode.TVDB_ID, [result]);
                                            }
                                        });
                                    } else {
                                        service.activityUpdate(serie, serie.name, 3); // 'autoDL disabled'
                                    }
                                });
                            });
                            SettingsService.set('autodownload.lastrun', new Date().getTime());
                            $rootScope.$broadcast('autodownload:activity');
                        });
                    });
                }

                service.checkTimeout = setTimeout(service.autoDownloadCheck, 1000 * 60 * 15); // fire new episodeaired check in 15 minutes.
            },

            autoDownload: function(serie, episode) {
                var minSeeders = SettingsService.get('autodownload.minSeeders'); // Minimum amount of seeders required, default 50
                var globalQuality = ' ' + SettingsService.get('torrenting.searchquality'); // Global Quality to append to search string.
                var globalInclude = SettingsService.get('torrenting.global_include'); // Any words in the global include list causes the result to be filtered in.
                var globalExclude = SettingsService.get('torrenting.global_exclude'); // Any words in the global exclude list causes the result to be filtered out.
                var globalSizeMin = SettingsService.get('torrenting.global_size_min'); // torrents smaller than this are filtered out
                 var globalSizeMax = SettingsService.get('torrenting.global_size_max'); // torrents larger than this are filtered out
                var searchEngine = TorrentSearchEngines.getDefaultEngine();
                if (serie.ignoreGlobalQuality != 0) {
                    globalQuality = ''; // series custom settings specify to ignore the global quality
                };
                if (serie.ignoreGlobalIncludes != 0) {
                    globalInclude = ''; // series custom settings specify to ignore the global Includes List
                };
                if (serie.ignoreGlobalExcludes != 0) {
                    globalExclude = ''; // series custom settings specify to ignore the global Excludes List
                };
                if (serie.searchProvider != null) {
                    searchEngine = TorrentSearchEngines.getSearchEngine(serie.searchProvider); // series custom search engine specified
                };
                // Fetch the Scene Name for the series and compile the search string for the episode with the quality requirement.
                return SceneNameResolver.getSearchStringForEpisode(serie, episode)
                .then(function(searchString) {
                    var q = searchString + globalQuality;
                    /**
                     * Word-by-word scoring for search results.
                     * All words need to be in the search result's release name, or the result will be filtered out.
                     */
                    function filterByScore(item) {
                        var score = 0;
                        var query = q.toLowerCase().split(' ');
                        name = item.releasename.toLowerCase();
                        query.map(function(part) {
                            if (name.indexOf(part) > -1) {
                                score++;
                            }
                        });
                        return (score == query.length);
                    }

                    /**
                     * Any words in the global include list causes the result to be filtered in.
                     */
                    function filterGlobalInclude(item) {
                        if (globalInclude == '') {
                            return true;
                        };
                        var score = 0;
                        var query = globalInclude.toLowerCase().split(' ');
                        name = item.releasename.toLowerCase();
                        query.map(function(part) {
                            if (name.indexOf(part) > -1) {
                                score++;
                            }
                        });
                        return (score > 0);
                    };

                    /**
                     * Any words in the global exclude list causes the result to be filtered out.
                     */
                    function filterGlobalExclude(item) {
                        if (globalExclude == '') {
                            return true;
                        };
                        var score = 0;
                        var query = globalExclude.toLowerCase().split(' ');
                        query = query.filter(function(el) {
                            return q.indexOf(el) == -1;
                        });
                        name = item.releasename.toLowerCase();
                        query.map(function(part) {
                            if (name.indexOf(part) > -1) {
                                score++;
                            }
                        });
                        return (score == 0);
                    };

                    /**
                     * Torrent sizes outside min-max range causes the result to be filtered out.
                     */
                    function filterBySize(item) {
                        if (item.size == null || item.size == 'n/a') {
                            // if item size not available then accept item
                            return true;
                        }
                        var size = item.size.split(/\s{1}/)[0]; // size split into value and unit
                        // serie custom Search Size is available for override
                        var sizeMin = (serie.customSearchSizeMin !== null) ? serie.customSearchSizeMin : globalSizeMin;
                        var sizeMax = (serie.customSearchSizeMax !== null) ? serie.customSearchSizeMax : globalSizeMax;
                        // set up accepted size range
                        sizeMin = (sizeMin == null) ? 0 : sizeMin;
                        sizeMax = (sizeMax == null) ? Number.MAX_SAFE_INTEGER : sizeMax;
                        return (size >= sizeMin && size <= sizeMax);
                    };

                    // Search torrent provider for the string
                    return searchEngine.search(q, true).then(function(results) {
                        var items = results.filter(filterBySize);
                        items = items.filter(filterByScore);
                        if (items.length === 0) {
                            service.activityUpdate(serie, q, 4); // 'nothing found'
                            return; // no results, abort
                        };
                        items = items.filter(filterGlobalInclude);
                        items = items.filter(filterGlobalExclude);
                        if (items.length === 0) {
                            service.activityUpdate(serie, q, 5); // 'filtered out'
                            return; // no results, abort
                        }
                        if (items[0].seeders == 'N/A' || parseInt(items[0].seeders, 10) >= minSeeders) { // enough seeders are available.
                            var url = items[0].magneturl;
                            var torrentHash = url.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase();
                            // launch the magnet uri via the TorrentSearchEngines's launchMagnet Method
                            DuckieTorrent.getClient().AutoConnect().then(function() {
                                TorrentSearchEngines.launchMagnet(url, serie.TVDB_ID, true);
                                episode.magnetHash = torrentHash;
                                episode.Persist();
                                // record that this magnet was launched under DuckieTV's control. Used by auto-Stop.
                                TorrentHashListService.addToHashList(torrentHash);
                            });
                            service.activityUpdate(serie, q, 6); // 'magnet launched'
                            return torrentHash;
                        } else {
                            service.activityUpdate(serie, q, 7, items[0].seeders + ' < ' + minSeeders); // 'seeders x < y'
                        }
                    });
                });
            },

            attach: function() {
                if (!service.checkTimeout) {
                    service.checkTimeout = setTimeout(service.autoDownloadCheck, 5000);
                    $rootScope.$on('torrentclient:connected', function(remote) {
                        console.info("Caught TorrentClient connected event! starting AutoDownload check!");
                        service.autoDownloadCheck();
                    });
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
.run(["$rootScope", "AutoDownloadService", "SettingsService",
    function($rootScope, AutoDownloadService, SettingsService) {

        if (SettingsService.get('torrenting.enabled') === true && SettingsService.get('torrenting.autodownload') === true) {
            setTimeout(function() {
                console.info('Initializing AutoDownload Service!');
                AutoDownloadService.attach();
            }, 5000);
        }
    }
]);
