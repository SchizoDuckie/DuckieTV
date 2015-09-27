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

DuckieTV.factory('TorrentSearchEngines', ["DuckieTorrent", "$rootScope", "dialogs", "$q", "SettingsService", "SceneNameResolver",
    function(DuckieTorrent, $rootScope, dialogs, $q, SettingsService, SceneNameResolver) {
        var activeMagnet = false;
        var engines = {};
        var defaultEngine = 'ThePirateBay';

        var service = {

            registerSearchEngine: function(name, implementation) {
                name in engines ? console.info("Updating torrent search engine", name) : console.info("Registering torrent search engine:", name);
                engines[name] = implementation;
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

            getSearchEngine: function(engine) {
                return engines[engine];
            },

            setDefault: function(name) {
                if (name in engines) {
                    defaultEngine = name;
                }
            },

            /**
             * @todo
             */
            removeSearchEngine: function(name) {
                if (name in engines) {
                    delete engines[name];
                    //SettingsService....
                }
            },
            /**
             * @todo
             */
            disableSearchEngine: function(name) {
                if (name in engines) {
                    //SettingsService....
                }
            },
            /**
             * @todo
             */
            enableSearchEngine: function(name) {
                if (name in engines) {
                    //SettingsService....
                }
            },

            findEpisode: function(serie, episode) {
                return SceneNameResolver.getSearchStringForEpisode(serie, episode).then(function(seasonepisode) {
                    return dialogs.create('templates/torrentDialog.html', 'torrentDialogCtrl', {
                        query: SceneNameResolver.getSceneName(serie.TVDB_ID, serie.name) + ' ' + seasonepisode,
                        TVDB_ID: episode.TVDB_ID
                    }, {
                        size: 'lg'
                    });
                });

            },


            search: function(query, TVDB_ID, options) {
                return dialogs.create('templates/torrentDialog.html', 'torrentDialogCtrl', {
                    query: query,
                    TVDB_ID: TVDB_ID
                }, options || {
                    size: 'lg'
                });
            },
            /**
             * launch magnet via a hidden iframe and broadcast the fact that it's selected to anyone listening
             */
            launchMagnet: function(magnet, TVDB_ID) {
                console.log("Firing magnet URI! ", magnet, TVDB_ID);
                $rootScope.$broadcast('magnet:select:' + TVDB_ID, magnet.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());

                if (DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    console.log("Adding via TorrentClient.addMagnet API! ", magnet, TVDB_ID);
                    DuckieTorrent.getClient().addMagnet(magnet);
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                } else {
                    var d = document.createElement('iframe');
                    d.id = 'torrentmagnet_' + new Date().getTime();
                    d.src = magnet;
                    d.style.visibility = 'hidden';
                    document.body.appendChild(d);
                    setTimeout(function() {
                        document.body.removeChild(d);
                    }, 3000);
                }
            },

            launchTorrentByUpload: function(data, TVDB_ID, name) {
                console.log("Firing Torrent By data upload! ", TVDB_ID, name);

                if (DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    console.log("Adding via TorrentClient.addTorrentByUpload API! ", TVDB_ID, name);
                    DuckieTorrent.getClient().addTorrentByUpload(data, name).then(function(infoHash) {
                        $rootScope.$broadcast('magnet:select:' + TVDB_ID, infoHash.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
                    });
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                }
            },

            launchTorrentByURL: function(torrentUrl, TVDB_ID, name) {
                console.log("Firing Torrent By URL! ", torrentUrl, TVDB_ID, name);

                if (DuckieTorrent.getClient().isConnected()) { // fast method when using utorrent api.
                    console.log("Adding via TorrentClient.addTorrentByUrl API! ", torrentUrl, TVDB_ID, name);
                    DuckieTorrent.getClient().addTorrentByUrl(torrentUrl, name).then(function(infoHash) {
                        $rootScope.$broadcast('magnet:select:' + TVDB_ID, infoHash.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
                    });
                    setTimeout(function() {
                        DuckieTorrent.getClient().Update(true); // force an update from torrent clients after 1.5 second to show the user that the torrent has been added.
                    }, 1500);
                } else {
                    var d = document.createElement('iframe');
                    d.id = 'torrenturl_' + new Date().getTime();
                    d.src = torrentUrl;
                    d.style.visibility = 'hidden';
                    document.body.appendChild(d);
                    d.onload = function() {
                        setTimeout(function() {
                            document.body.removeChild(d);
                        }, 500);
                    };
                }
            }
        };

        service.setDefault(SettingsService.get('torrenting.searchprovider'));

        return service;
    }
]);