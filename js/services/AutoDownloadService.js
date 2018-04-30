/**
 * The AutoDownloadService checks if a download is available for a TV-Show that's aired
 * and automatically downloads the first search result if it passes all the filters and more than minSeeders seeders are available.
 * SE must have magnets as we need the torrentHash to track progress. magnets on details page are supported.
 */
DuckieTV

    .factory('AutoDownloadService', ["$rootScope", "$injector", "$filter", "FavoritesService", "SceneNameResolver", "SettingsService", "TorrentSearchEngines", "DuckieTorrent", "TorrentHashListService", "NotificationService",
    function($rootScope, $injector, $filter, FavoritesService, SceneNameResolver, SettingsService, TorrentSearchEngines, DuckieTorrent, TorrentHashListService, NotificationService) {

        var service = {
            checkTimeout: null,
            activityList: [],
            fromDT: null,
            toDT: null,

            activityUpdate: function(serie, episode, search, status, extra) {
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
                service.activityList.push({
                    'search': search,
                    'searchProvider': sp,
                    'csmExtra': csmExtra,
                    'csm': csm,
                    'css': css,
                    'ipq': serie.ignoreGlobalQuality,
                    'irk': serie.ignoreGlobalIncludes,
                    'iik': serie.ignoreGlobalExcludes,
                    'status': status,
                    'extra': extra,
                    'serie': serie,
                    'episode': episode
                });
                $rootScope.$broadcast('autodownload:activity');
            },

            autoDownloadCheck: function() {
                if (SettingsService.get('torrenting.autodownload') === false) {
                    service.detach();
                    return;
                }

                service.activityList = [];
                var period = parseInt(SettingsService.get('autodownload.period')); // Period to check for updates up until today current time, default 1
                var settingsDelay = parseInt(SettingsService.get('autodownload.delay')); // Period in minutes to wait after episode has aired before auto-downloading, default 15m
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
                var showSpecials = SettingsService.get('calendar.show-specials');

                if (DuckieTorrent.getClient().isConnected()) {
                    DuckieTorrent.getClient().AutoConnect().then(function(remote) {
                        // Get the list of episodes that have aired since period, and iterate them.
                        FavoritesService.getEpisodesForDateRange(service.fromDT, service.toDT).then(function(candidates) {
                            candidates.map(function(episode) {
                                CRUD.FindOne('Serie', {
                                    ID_Serie: episode.ID_Serie
                                }).then(function(serie) {
                                    var serieEpisode = serie.name + ' ' + episode.getFormattedEpisode();
                                    // filter out episode from torrent search
                                    if (episode.seasonnumber === 0 && !showSpecials && serie.ignoreHideSpecials !== 1) {
                                        service.activityUpdate(serie, episode, serieEpisode, 3, ' HS'); // 'autoDL disabled HS'
                                        return; // user has chosen not to show specials on calendar so we assume they do not expect them to be auto-downloaded
                                    };
                                    if (serie.displaycalendar !== 1) {
                                        service.activityUpdate(serie, episode, serieEpisode, 3, ' HC'); // 'autoDL disabled HC'
                                        return; // user has chosen not to show series on calendar so we assume they do not expect them to be auto-downloaded
                                    };
                                    if (episode.isDownloaded()) {
                                        service.activityUpdate(serie, episode, serieEpisode, 0); // 'downloaded'
                                        return; // if the episode was already downloaded, skip it.
                                    };
                                    if (episode.watchedAt !== null) {
                                        service.activityUpdate(serie, episode, serieEpisode, 1); // 'watched'
                                        return; // if the episode has been marked as watched, skip it.
                                    };
                                    if (episode.magnetHash !== null && (episode.magnetHash in remote.torrents)) {
                                        service.activityUpdate(serie, episode, serieEpisode, 2); // 'has magnet'
                                        return; // if the episode already has a magnet, skip it.
                                    };
                                    /**
                                     * is episode onair? don't go looking for torrent yet. (saves pointless broadband usage)
                                     * default onair end-time is calculated as firstaired + runtime minutes + delay minutes
                                     * if firstaired < 1 or null default to (now - runtime - delay) (i.e. force looking for torrent)
                                     * if runtime is null defaults to 60mins
                                     * delay defaults to 15mins in settings
                                     */
                                    var delay = (serie.customDelay) ? parseInt(serie.customDelay) : settingsDelay; // override settings delay with series custom delay if used
                                    delay = (delay > (period * 24 * 60)) ? period * 24 * 60 : delay; // sanity check.  Period could have changed after serie.CustomDelay was set.
                                    var epfa = (episode.firstaired !== null && episode.firstaired > 0) ? new Date(episode.firstaired) : service.toDT - runtime - delay;
                                    var runtime = (serie.runtime) ? parseInt(serie.runtime) : 60;
                                    var episodeAired = new Date(epfa.getFullYear(), epfa.getMonth(), epfa.getDate(), epfa.getHours(), epfa.getMinutes() + runtime + delay, epfa.getSeconds()).getTime();
                                    if (episodeAired > service.toDT) {
                                        var totalMinutesToGo = ((episodeAired - service.toDT) / 1000 / 60);
                                        var dhm = totalMinutesToGo.minsToDhm();
                                        if (totalMinutesToGo < (24 * 60)) {
                                            dhm = dhm.substr(2); // less that 24 hours, strip the leading days
                                        }
                                        service.activityUpdate(serie, episode, serieEpisode, 8, ' ' + dhm); // 'onair + delay'
                                        return; // the episode is broadcasting right now
                                    };

                                    if (serie.autoDownload == 1) {
                                        service.autoDownload(serie, episode);
                                    } else {
                                        service.activityUpdate(serie, episode, serieEpisode, 3); // 'autoDL disabled'
                                    }
                                });
                            });
                            SettingsService.set('autodownload.lastrun', new Date().getTime());
                            $rootScope.$broadcast('autodownload:activity');
                        });
                    });
                }

                service.detach();
                service.checkTimeout = setTimeout(service.autoDownloadCheck, 1000 * 60 * 15); // fire new episodeaired check in 15 minutes.
            },

            autoDownload: function(serie, episode) {
                var minSeeders = SettingsService.get('torrenting.min_seeders'); // Minimum amount of seeders required, default 50
                var preferredQuality = SettingsService.get('torrenting.searchquality'); // Preferred Quality to append to search string.
                var requireKeywords = SettingsService.get('torrenting.require_keywords'); // Any words in the Require Keywords list causes the result to be filtered in.
                var requireKeywordsModeOR = SettingsService.get('torrenting.require_keywords_mode_or'); // set the Require Keywords mode (true=Any or false=All)
                var ignoreKeywords = SettingsService.get('torrenting.ignore_keywords'); // Any words in the Ignore Keywords list causes the result to be filtered out.
                var globalSizeMin = SettingsService.get('torrenting.global_size_min'); // torrents smaller than this are filtered out
                var globalSizeMax = SettingsService.get('torrenting.global_size_max'); // torrents larger than this are filtered out
                var searchEngine = TorrentSearchEngines.getDefaultEngine();
                var label = (SettingsService.get('torrenting.label')) ? serie.name : null;
                var RequireKeywords_String = ''; // for use in filterByScore when Require Keywords mode is set to ALL
                if (serie.ignoreGlobalQuality != 0) {
                    preferredQuality = ''; // series custom settings specify to ignore the preferred quality
                };
                if (serie.ignoreGlobalIncludes != 0) {
                    requireKeywords = ''; // series custom settings specify to ignore the Require Keywords List
                } else {
                    RequireKeywords_String = requireKeywordsModeOR ? '' : ' ' + requireKeywords; // for use with filterByScore when Require Keywords mode is set to ALL
                };
                if (serie.ignoreGlobalExcludes != 0) {
                    ignoreKeywords = ''; // series custom settings specify to ignore the Ignore Keywords List
                };
                if (serie.searchProvider != null) {
                    searchEngine = TorrentSearchEngines.getSearchEngine(serie.searchProvider); // series custom search engine specified
                };
                // Fetch the Scene Name for the series and compile the search string for the episode with the quality requirement.
                return SceneNameResolver.getSearchStringForEpisode(serie, episode).then(function(searchString) {
                    var q = [searchString,preferredQuality,RequireKeywords_String].join(' ').trim();      
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
                     * Any words in the Require Keywords list causes the result to be filtered in.
                     */
                    function filterRequireKeywords(item) {
                        if (requireKeywords == '') {
                            return true;
                        };
                        var score = 0;
                        var query = requireKeywords.toLowerCase().split(' ');
                        name = item.releasename.toLowerCase();
                        query.map(function(part) {
                            if (name.indexOf(part) > -1) {
                                score++;
                            }
                        });
                        return (score > 0);
                    };

                    /**
                     * Any words in the ignore keyword list causes the result to be filtered out.
                     */
                    function filterIgnoreKeywords(item) {
                        if (ignoreKeywords == '') {
                            return true;
                        };
                        var score = 0;
                        var query = ignoreKeywords.toLowerCase().split(' ');
                        // prevent the exclude list from overriding the primary search string
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

                    /**
                     * Search torrent SE for the torrent query
                     */
                    return searchEngine.search(q, true).then(function(results) {
                        var items = $filter('orderBy')(results, '-seeders');
                        items = items.filter(filterByScore);
                        if (items.length === 0) {
                            service.activityUpdate(serie, episode, q, 4); // 'nothing found'
                            return; // no results, abort
                        };
                        if (requireKeywordsModeOR) {
                            items = items.filter(filterRequireKeywords);
                            if (items.length === 0) {
                                service.activityUpdate(serie, episode, q, 5, ' RK'); // 'filtered out RK'
                                return; // no results, abort
                            }
                        };
                        items = items.filter(filterIgnoreKeywords);
                        if (items.length === 0) {
                            service.activityUpdate(serie, episode, q, 5, ' IK'); // 'filtered out IK'
                            return; // no results, abort
                        }
                        items = items.filter(filterBySize);
                        if (items.length === 0) {
                            service.activityUpdate(serie, episode, q, 5, ' MS'); // 'filtered out MS'
                            return; // no results, abort
                        };
                        if (items[0].seeders != 'n/a' && parseInt(items[0].seeders, 10) < minSeeders) { // not enough seeders are available.
                            service.activityUpdate(serie, episode, q, 7, items[0].seeders + ' < ' + minSeeders); // 'seeders x < y'
                            return; // no results, abort
                        }

                        DuckieTorrent.getClient().AutoConnect().then(function() {
                            var torrentHash = null;
                            var debugNotify = function(notificationId) { if (window.debug982) console.debug('ADS notify id', notificationId);};
                            NotificationService.notify(
                                [serie.name, episode.getFormattedEpisode()].join(' '),
                                [items[0].releasename, "Download started on", DuckieTorrent.getClient().getName()].join(' '),
                                debugNotify
                            );
                            if (items[0].magnetUrl) {
                                torrentHash = items[0].magnetUrl.getInfoHash();
                                TorrentSearchEngines.launchMagnet(items[0].magnetUrl, episode.TVDB_ID, serie.dlPath, label);
                                episode.magnetHash = torrentHash;
                                episode.Persist().then(function() {
                                    if (window.debug982) console.debug('ADS (search=magnet): episode download started ID_Episode(%s), ID_Serie(%s), episodename(%s), episodenumber(%s), seasonnumber(%s), watched(%s), watchedAt(%s), downloaded(%s), torrentHash(%s)', episode.ID_Episode, episode.ID_Serie, episode.episodename, episode.episodenumber, episode.seasonnumber, episode.watched, episode.watchedAt, episode.downloaded, episode.magnetHash);
                                });
                            } else if (items[0].torrentUrl) {
                                window.parseTorrent.remote(items[0].torrentUrl, function(err, torrentDecoded){
                                    if (err) {
                                        throw err;
                                    }
                                    torrentHash = torrentDecoded.infoHash.getInfoHash();
                                    $injector.get('$http').get(items[0].torrentUrl, {
                                        responseType: 'blob'
                                    }).then(function(result) {
                                        try {
                                            TorrentSearchEngines.launchTorrentByUpload(result.data, torrentHash, episode.TVDB_ID, items[0].releasename, serie.dlPath, label);
                                        } catch (E) {
                                            TorrentSearchEngines.launchTorrentByURL(items[0].torrentUrl, torrentHash, episode.TVDB_ID, items[0].releasename, serie.dlPath, label);
                                        }
                                        episode.magnetHash = torrentHash;
                                        episode.Persist().then(function() {
                                            if (window.debug982) console.debug('ADS (search=url/upload): episode download started ID_Episode(%s), ID_Serie(%s), episodename(%s), episodenumber(%s), seasonnumber(%s), watched(%s), watchedAt(%s), downloaded(%s), torrentHash(%s)', episode.ID_Episode, episode.ID_Serie, episode.episodename, episode.episodenumber, episode.seasonnumber, episode.watched, episode.watchedAt, episode.downloaded, episode.magnetHash);
                                        });
                                    });
                                });
                            } else {
                                searchEngine.getDetails(items[0].detailUrl, items[0].releasename).then(function(details)  {
                                    if (details.magnetUrl) {
                                        torrentHash = details.magnetUrl.getInfoHash();
                                        TorrentSearchEngines.launchMagnet(details.magnetUrl, episode.TVDB_ID, serie.dlPath, label);
                                        episode.magnetHash = torrentHash;
                                        episode.Persist().then(function() {
                                            if (window.debug982) console.debug('ADS (details=magnet): episode download started ID_Episode(%s), ID_Serie(%s), episodename(%s), episodenumber(%s), seasonnumber(%s), watched(%s), watchedAt(%s), downloaded(%s), torrentHash(%s)', episode.ID_Episode, episode.ID_Serie, episode.episodename, episode.episodenumber, episode.seasonnumber, episode.watched, episode.watchedAt, episode.downloaded, episode.magnetHash);
                                        });
                                    } else if (details.torrentUrl) {
                                        window.parseTorrent.remote(details.torrentUrl, function(err, torrentDecoded){
                                            if (err) {
                                                throw err;
                                            }
                                            torrentHash = torrentDecoded.infoHash.getInfoHash();
                                            $injector.get('$http').get(details.torrentUrl, {
                                                responseType: 'blob'
                                            }).then(function(result) {
                                                try {
                                                    TorrentSearchEngines.launchTorrentByUpload(result.data, torrentHash, episode.TVDB_ID, items[0].releasename, serie.dlPath, label);
                                                } catch (E) {
                                                    TorrentSearchEngines.launchTorrentByURL(details.torrentUrl, torrentHash, episode.TVDB_ID, items[0].releasename, serie.dlPath, label);
                                                }
                                                episode.magnetHash = torrentHash;
                                                episode.Persist().then(function() {
                                                    if (window.debug982) console.debug('ADS (details=url/upload): episode download started ID_Episode(%s), ID_Serie(%s), episodename(%s), episodenumber(%s), seasonnumber(%s), watched(%s), watchedAt(%s), downloaded(%s), torrentHash(%s)', episode.ID_Episode, episode.ID_Serie, episode.episodename, episode.episodenumber, episode.seasonnumber, episode.watched, episode.watchedAt, episode.downloaded, episode.magnetHash);
                                                });
                                            });
                                        });
                                    } 
                                });
                            }
                            service.activityUpdate(serie, episode, q, 6); // 'torrent launched'
                        });
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

            var timeoutDelay = 5000; // optional customisation for #1062
            if (localStorage.getItem('custom_AutoDownload_delay')) {
                timeoutDelay = localStorage.getItem('custom_AutoDownload_delay');
            };

            setTimeout(function() {
                console.info('Initializing AutoDownload Service!');
                AutoDownloadService.attach();
            }, timeoutDelay);
        }
    }
]);