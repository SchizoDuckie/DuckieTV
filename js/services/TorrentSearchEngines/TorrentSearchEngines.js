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

DuckieTV.factory('TorrentSearchEngines', ["$rootScope", "$q", "$http" ,"$injector", "DuckieTorrent", "dialogs", "SettingsService", "SceneNameResolver", "TorrentHashListService",
    function($rootScope, $q, $http, $injector, DuckieTorrent, dialogs, SettingsService, SceneNameResolver, TorrentHashListService) {
        var activeEngines = {},
            nativeEngines = {},
            jackettEngines = {},
            defaultEngineName = 'ThePirateBay',
            templateName = 'templates/dialogs/torrent.html',
            dialogCtrl = 'torrentDialogCtrl';

        if (SettingsService.get('torrentDialog.2.enabled')) {
            templateName = 'templates/dialogs/torrent2.html';
            dialogCtrl = 'torrentDialog2Ctrl';
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

            // cache of DB jackett elements
            jackettCache: [],

            // return DB jackett element from cache by name
            getJackettFromCache: function(name) {
                return service.jackettCache.filter(function(el) {
                    return el.name == name;
                })[0];
            },

            // delete DB jackett element from cache
            removeJackettFromCache: function(name) {
                var jackett = service.getJackettFromCache(name);
                if (jackett) {
                    service.jackettCache = service.jackettCache.filter(function(el) {
                        return el.getID() != jackett.getID();
                    });
                }
            },

            // register native SE (and disable jackett SE of same name)
            registerSearchEngine: function(name, implementation) {
                if (name in jackettEngines) {
                    var jackett = service.getJackettFromCache(name);
                    jackett.setDisabled();
                    jackettEngines[name].enabled = false;
                    console.info('Jackett Engine %s disabled.', name);
                }                
                implementation.enabled = true;
                implementation.config.name = name;
                activeEngines[name] = nativeEngines[name] = implementation;
                name in activeEngines ? console.info("Updating torrent search engine", name) : console.info("Registering torrent search engine:", name);
            },

            // register jackett SE (and disable native SE of same name)
            registerJackettEngine: function(name, implementation) {
                if (name in nativeEngines) {
                    nativeEngines[name].enabled = false;
                    console.info('torrent Engine %s disabled.', name);
                }
                implementation.enabled = true;
                activeEngines[name] = jackettEngines[name] = implementation;
                name in activeEngines ? console.info("Updating Jackett search engine", name) : console.info("Registering Jackett search engine:", name);
            },

            // add jackett SE from DB jackett element (add to cache, and register it if enabled)
            addJackettEngine: function(jackett) {
                var config = JSON.parse(jackett.json);
                var engine = new GenericTorrentSearchEngine(config, $q, $http, $injector);
                engine.testOK = true;
                engine.testMessage = '';
                engine.testing = false;
                engine.enabled = false;
                jackettEngines[jackett.name] = engine;
                if (jackett.isEnabled()) {
                    engine.enabled = true;
                    console.log("Jackett search engine loaded and added to activeEngines: ", jackett.name);
                    if (jackett.name in activeEngines) {
                        console.warn("Jackett engine %s overrides built-in search engine with the same name.",  jackett.name);
                    }
                    service.registerJackettEngine(jackett.name, engine);
                }
                service.jackettCache.push(jackett);
            },

            // return all active engines (both native and jackett)
            getSearchEngines: function() {
                return activeEngines;
            },

            // return active SE by name
            getSearchEngine: function(name) {
                if (name in activeEngines) {
                    return activeEngines[name];
                } else {
                    console.warn('search provider %s not found. default %s provider used instead.', name, defaultEngineName);
                    return activeEngines[defaultEngineName];
                }
            },

            // return all native SEs
            getNativeEngines: function() {
                return nativeEngines;
            },

            // return the default search engine
            getDefaultEngine: function() {
                return activeEngines[defaultEngineName];
            },

            // return the default search engine name
            getDefaultEngineName: function() {
                return defaultEngineName;
            },

            // return all jackett SEs
            getJackettEngines: function() {
                return jackettEngines;
            },

            // return a jackett SE by name
            getJackettEngine: function(name) {
                return jackettEngines[name];
            },

            // set the default SE by name
            setDefault: function(name) {
                if (name in activeEngines) {
                    defaultEngineName = name;
                }
            },

            // delete a jackett engine (from everywhere)
            removeJackettEngine: function(engine) {
                delete jackettEngines[engine.config.name];
                if (engine.enabled) {
                    delete activeEngines[engine.config.name];                    
                }
                var jackett = service.getJackettFromCache(engine.config.name);
                if ('Delete' in jackett) {
                    jackett.Delete().then(function() {
                        service.jackettCache = service.jackettCache.filter(function(el) {
                            return el.getID() != jackett.getID();
                        });
                        console.info("Jackett '" + jackett.name + "' deleted.");
                    });
                }
            },

            // disable active SE (and if jackett then enable native SE of same name)
            disableSearchEngine: function(engine) {
                delete activeEngines[engine.config.name];                    
                if ('isJackett' in engine.config && engine.config.isJackett) {
                    var jackett = service.getJackettFromCache(engine.config.name);
                    jackett.setDisabled();
                    jackettEngines[engine.config.name].enabled = false;
                    console.info('Jackett Engine %s disabled.', engine.config.name);
                    if (engine.config.name in nativeEngines) {
                        service.enableSearchEngine(nativeEngines[engine.config.name]);
                    }
                } else {
                    nativeEngines[engine.config.name].enabled = false;                    
                    console.info('torrent Engine %s disabled.', engine.config.name);
                }
            },

            // enable SE (either jackett or native)
            enableSearchEngine: function(engine) {
                if ('isJackett' in engine.config && engine.config.isJackett) {
                    service.registerJackettEngine(engine.config.name, engine);
                    var jackett = service.getJackettFromCache(engine.config.name);
                    jackett.setEnabled();
                } else {
                    service.registerSearchEngine(engine.config.name, engine);
                }
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
                    if (window.debug982) console.debug("Adding via TorrentClient.addMagnet API! ", magnet, TVDB_ID, dlPath, label);
                    DuckieTorrent.getClient().addMagnet(magnet, dlPath, label);
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                } else {
                    if (window.debug982) console.debug("Adding via openURL! ", magnet, TVDB_ID, dlPath, label);
                    openUrl('magnet', magnet);
                }
                $rootScope.$broadcast('torrent:select:' + TVDB_ID, magnet.getInfoHash());
                // record that this magnet was launched under DuckieTV's control. Used by auto-Stop.
                TorrentHashListService.addToHashList(magnet.getInfoHash());
            },

            launchTorrentByUpload: function(data, infoHash, TVDB_ID, releaseName, dlPath, label) {
                console.info("Firing Torrent By data upload! ", TVDB_ID, infoHash, releaseName, dlPath, label);

                if (DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    if (window.debug982) console.debug("Adding via TorrentClient.addTorrentByUpload API! ", TVDB_ID, infoHash, releaseName, dlPath, label);
                    DuckieTorrent.getClient().addTorrentByUpload(data, infoHash, releaseName, dlPath, label).then(function() {
                        $rootScope.$broadcast('torrent:select:' + TVDB_ID, infoHash);
                        // record that this .torrent was launched under DuckieTV's control. Used by auto-Stop.
                        TorrentHashListService.addToHashList(infoHash);
                    });
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                }
            },

            launchTorrentByURL: function(torrentUrl, infoHash, TVDB_ID, releaseName, dlPath, label) {
                console.info("Firing Torrent By URL! ", torrentUrl, TVDB_ID, infoHash, releaseName, dlPath, label);

                if (!SettingsService.get('torrenting.launch_via_chromium') && DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    if (window.debug982) console.debug("Adding via TorrentClient.addTorrentByUrl API! ", torrentUrl, TVDB_ID, infoHash, releaseName, dlPath, label);
                    DuckieTorrent.getClient().addTorrentByUrl(torrentUrl, infoHash, releaseName, dlPath, label).then(function() {
                        $rootScope.$broadcast('torrent:select:' + TVDB_ID, infoHash);
                        // record that this .torrent was launched under DuckieTV's control. Used by auto-Stop.
                        TorrentHashListService.addToHashList(infoHash);
                    });
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                } else {
                    if (window.debug982) console.debug("Adding via openURL! ", torrentUrl, TVDB_ID, infoHash, releaseName, dlPath, label);
                    openUrl('torrent', torrentUrl);
                }
            },

            initialize: function() {
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
                    }, function(error) {
                        // oops, something when wrong. provide default if there is no previous save
                        if ('trackers.fallBackList' in localStorage) {
                            service.trackers = localStorage.getItem('trackers.fallBackList');
                            console.warn("Failed to fetch latest trackers fall back list, keeping previous.", error.status, error.statusText);                        
                        } else {
                            service.trackers = [
                                "&tr=udp://tracker.coppersurfer.tk:6969/announce",
                                "&tr=udp://tracker.zer0day.to:1337/announce",
                                "&tr=udp://tracker.leechers-paradise.org:6969/announce",
                                "&tr=udp://9.rarbg.com:2710/announce"
                            ].join('');
                            localStorage.setItem('trackers.fallBackList', service.trackers);
                            console.warn("Failed to fetch latest trackers fall back list, saving default.", error.status, error.statusText);      
                        }
                    });
                };
                // load jackett engines
                CRUD.Find("Jackett").then(function(results) {
                    results.map(function(jackett) {
                        service.addJackettEngine(jackett);
                    });
                })
            }
        };
        return service;
    }
])
.run(["TorrentSearchEngines", "SettingsService",
    function(TorrentSearchEngines, SettingsService) {
        TorrentSearchEngines.initialize();
        TorrentSearchEngines.setDefault(SettingsService.get('torrenting.searchprovider'));
        if (SettingsService.get('torrenting.enabled')) {

            var timeoutDelay = 2000; // optional customisation for #1062
            if (localStorage.getItem('custom_default_SE_providers_delay')) {
                timeoutDelay = localStorage.getItem('custom_default_SE_providers_delay');
            };

            // delay for 2 second so that custom clients can register themselves before determining default engine.
            setTimeout(function() {

                var providers = TorrentSearchEngines.getSearchEngines();
                if (!(SettingsService.get('torrenting.searchprovider') in providers)) {
                    // auto-config migration, fallback to first provider in the list when we detect an invalid provider.
                    console.warn("Invalid search provider detected: ", SettingsService.get('torrenting.searchprovider'), " defaulting to ", Object.keys(providers)[0]);
                    SettingsService.set('torrenting.searchprovider', Object.keys(providers)[0]);
                }
                TorrentSearchEngines.setDefault(SettingsService.get('torrenting.searchprovider'));

            }, timeoutDelay);
        }
    }
]);
