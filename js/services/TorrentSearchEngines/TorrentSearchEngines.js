/**
 * Abstraction layer for the different torrent search engines that DuckieTV supports.
 * Search engines register themselves in the app's .run() block using TorrentSearchEngines.registerEngine(name, instance)
 *
 * All an engine needs to provide is a .search method. It can be both an angular factory or a plain old javascript instantiated function
 * The TorrentDialog directive lists these search engines and can switch between them.
 * The AutoDownloadService uses the default engine to look for torrents on aired episodes.
 *
 * There is a GenericTorrentSearchEngine.js in this folder that can scrape a lot of torrent sites by just passing in some endpoints and css selectors.
 * @see GenericTorrentSearch for more info or browse through the other torrent clients in this folder.
 */

DuckieTV.factory('TorrentSearchEngines', ["DuckieTorrent", "$rootScope", "dialogs", "$q", "SettingsService", "SceneNameResolver", "$http", "$injector",
    function(DuckieTorrent, $rootScope, dialogs, $q, SettingsService, SceneNameResolver, $http, $injector) {
        var engines = {},
            nativeEngines = {},
            customEngines = {},
            defaultEngine = 'ThePirateBay',
            templateName = 'templates/dialogs/torrent.html',
            dialogCtrl = 'torrentDialogCtrl';

        if (SettingsService.get('torrentDialog.2.enabled')) {
            templateName = 'templates/dialogs/torrent2.html';
            dialogCtrl = 'torrentDialog2Ctrl';
        }

        function init() {
            var lastFetched = ('trackers.lastFetched' in localStorage) ? new Date(parseInt(localStorage.getItem('trackers.lastFetched'))) : new Date();
            if (('trackers.fallBackList' in localStorage) && lastFetched.getTime() + 2592000000 > new Date().getTime()) {
                // its not been 30 days since the last update, use existing trackers fall back list
                service.trackers = localStorage.getItem('trackers.fallBackList');
                console.info("Fetched trackers fall back list from localStorage.");
            } else {
                // its been 30 days since the last update, time to refresh
                $http.get('https://raw.githubusercontent.com/ngosang/trackerslist/master/trackers_best.txt').then(function(response) {
                    // prefix each tracker url with &tr= and strip CRLFs
                    var rawTrackers = response.data.split(/\n\n/);
                    service.trackers = rawTrackers.map(function(url) {
                        return (url) ? "&tr=" + url : '';
                    }).join('');
                    localStorage.setItem('trackers.fallBackList', service.trackers);
                    localStorage.setItem('trackers.lastFetched', new Date().getTime());
                    console.info("Updated localStorage with latest trackers fall back list.");
                });
            };
            engines = angular.copy(nativeEngines);
            return CRUD.Find("SearchEngine").then(function(results) {
                results.map(function(engine) {
                    customEngines[engine.name] = engine;
                });
                return customEngines;
            }).then(function() {
                Object.keys(customEngines).map(function(name) {
                    var engine = customEngines[name];
                    if (!engine.enabled) {
                        return;
                    }
                    console.log("Custom search engine loaded and added to default engines: ", name);
                    if (name in engines) {
                        console.warn(name, "overrides built-in search engine with the same name!");
                    }
                    engines[name] = customEngines[name].getInstance($q, $http, $injector);
                });
            })
        }

        function openUrl(id, url) {
            if (SettingsService.isStandalone() && id === 'magnet') {
                // for standalone, open magnet url direct to os https://github.com/SchizoDuckie/DuckieTV/issues/834
                nw.Shell.openExternal(url);
                //console.debug("Open via OS", id, url);
            } else {
                // for chrome extension, open url on chromium via iframe
                var d = document.createElement('iframe');
                d.id = id + 'url_' + new Date().getTime();
                d.style.visibility = 'hidden';
                d.src = url;
                document.body.appendChild(d);
                //console.debug("Open via Chromium", d.id, url);
                var dTimer = setInterval(function() {
                    var dDoc = d.contentDocument || d.contentWindow.document;
                    if (dDoc.readyState == 'complete') {
                        document.body.removeChild(d);
                        clearInterval(dTimer);
                        return;
                    }
                }, 1500);
            }
        };

        var service = {

            // list of common current trackers for SE that don't provide any on their magnets (1337x, IsoHunt, Idope, LimeTorrents, TorrentZ2)
            trackers: '',

            registerSearchEngine: function(name, implementation) {
                name in engines ? console.info("Updating torrent search engine", name) : console.info("Registering torrent search engine:", name);
                engines[name] = nativeEngines[name] = implementation;
            },

            getSearchEngines: function() {
                return engines;
            },

            getDefaultEngine: function() {
                return engines[defaultEngine];
            },
            getDefault: function() {
                return defaultEngine;
            },
            getCustomSearchEngines: function() {
                return customEngines;
            },
            getCustomSearchEngine: function(name) {
                return customEngines[name];
            },
            getSearchEngine: function(engine) {
                if (engine in engines) {
                    return engines[engine];
                } else {
                    console.warn('search provider %s not found. default %s provider used instead.', engine, defaultEngine);
                    return engines[defaultEngine];
                }
            },

            setDefault: function(name) {
                if (name in engines) {
                    defaultEngine = name;
                }
            },

            removeSearchEngine: function(engine) {
                delete engine.customEngines[name];
                engine.deleteYourSelf().then(init);
            },

            disableSearchEngine: function(engine) {
                engine.enabled = 0;
                engine.Persist().then(init)
            },

            enableSearchEngine: function(engine) {
                engine.enabled = 1;
                engine.Persist().then(init)
            },

            findEpisode: function(serie, episode) {
                return SceneNameResolver.getSearchStringForEpisode(serie, episode).then(function(searchString) {
                    return dialogs.create(templateName, dialogCtrl, {
                        query: searchString,
                        TVDB_ID: episode.TVDB_ID,
                        serie: serie,
                        episode: episode
                    }, {
                        size: 'lg'
                    });
                });

            },


            search: function(query, TVDB_ID, options) {
                return dialogs.create(templateName, dialogCtrl, {
                    query: query,
                    TVDB_ID: TVDB_ID
                }, options || {
                    size: 'lg'
                });
            },
            /**
             * launch magnet via a hidden iframe and broadcast the fact that it's selected to anyone listening
             */
            launchMagnet: function(magnet, TVDB_ID, dlPath, label) {
                console.info("Firing magnet URI! ", magnet, TVDB_ID, dlPath, label);

                if (!SettingsService.get('torrenting.launch_via_chromium') && DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    //console.debug("Adding via TorrentClient.addMagnet API! ", magnet, TVDB_ID);
                    DuckieTorrent.getClient().addMagnet(magnet, dlPath, label);
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                    $rootScope.$broadcast('magnet:select:' + TVDB_ID, magnet.getInfoHash());
                } else {
                    openUrl('magnet', magnet);
                    $rootScope.$broadcast('magnet:select:' + TVDB_ID, magnet.getInfoHash());
                }
            },

            launchTorrentByUpload: function(data, TVDB_ID, name, dlPath, label) {
                console.info("Firing Torrent By data upload! ", TVDB_ID, name, dlPath, label);

                if (DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    //console.debug("Adding via TorrentClient.addTorrentByUpload API! ", TVDB_ID, name);
                    DuckieTorrent.getClient().addTorrentByUpload(data, name, dlPath, label).then(function(infoHash) {
                        $rootScope.$broadcast('magnet:select:' + TVDB_ID, infoHash.getInfoHash());
                    });
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                }
            },

            launchTorrentByURL: function(torrentUrl, TVDB_ID, name, dlPath, label) {
                console.info("Firing Torrent By URL! ", torrentUrl, TVDB_ID, name, dlPath, label);

                if (!SettingsService.get('torrenting.launch_via_chromium') && DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    //console.debug("Adding via TorrentClient.addTorrentByUrl API! ", torrentUrl, TVDB_ID, name);
                    DuckieTorrent.getClient().addTorrentByUrl(torrentUrl, name, dlPath, label).then(function(infoHash) {
                        $rootScope.$broadcast('magnet:select:' + TVDB_ID, infoHash.getInfoHash());
                    });
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                } else {
                    openUrl('torrent', torrentUrl);
                }
            }
        };

        init();
        service.setDefault(SettingsService.get('torrenting.searchprovider'));
        return service;
    }
]);