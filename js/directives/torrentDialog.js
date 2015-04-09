DuckieTV.factory('TorrentDialog', ["DuckieTorrent", "$rootScope", "$dialogs", "$q", "SettingsService",
    function(DuckieTorrent, $rootScope, $dialogs, $q, SettingsService) {
        var activeMagnet = false;
        var engines = {};
        var defaultEngine = 'ThePirateBay';



        var service = {

            registerSearchEngine: function(name, implementation) {
                console.log("Registering torrent search engine:", name);
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

            search: function(query, TVDB_ID, options) {
                return $dialogs.create('templates/torrentDialog.html', 'torrentDialogCtrl', {
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
            }
        };

        service.setDefault(SettingsService.get('torrenting.searchprovider'));

        return service;
    }
])

.controller('torrentDialogCtrl', ["$scope", "$rootScope", "$modalInstance", "$injector", "data", "TorrentDialog", "SettingsService",
    function($scope, $rootScope, $modalInstance, $injector, data, TorrentDialog, SettingsService) {
        //-- Variables --//

        $scope.items = [];
        $scope.searching = true;
        $scope.query = angular.copy(data.query);
        $scope.TVDB_ID = angular.copy(data.TVDB_ID);
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');

        $scope.getName = function(provider) {
            return provider;
        };

        $scope.search = function(q, TVDB_ID) {
            $scope.searching = true;
            $scope.query = q;
            if (TVDB_ID !== undefined) {
                $scope.TVDB_ID = TVDB_ID;
            }

            TorrentDialog.getSearchEngine($scope.searchprovider).search([q, $scope.searchquality].join(' ')).then(function(results) {
                    $scope.items = results;
                    $scope.searching = false;
                },
                function(e) {
                    $scope.searching = false;
                });
        };

        // Changes the search quality while searching for a torrent
        $scope.setQuality = function(quality) {
            $scope.searchquality = quality;
            $scope.search($scope.query);
        };

        // Changes what search provider you search with
        $scope.setProvider = function(provider) {
            $scope.searchprovider = provider;
            $scope.search($scope.query);
        }

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        // Selects and launchs magnet
        $scope.magnetSelect = function(magnet) {
            console.info("Magnet selected!", magnet);
            $modalInstance.close(magnet);

            var channel = $scope.TVDB_ID !== null ? $scope.TVDB_ID : $scope.query;
            TorrentDialog.launchMagnet(magnet, channel);
        };

        $scope.clients = Object.keys(TorrentDialog.getSearchEngines());

        $scope.search($scope.query);
    }
])

.directive('torrentDialog', ["TorrentDialog", "$filter",
    function(TorrentDialog, $filter) {
        return {
            restrict: 'E',
            transclude: true,
            wrap: true,
            replace: true,
            scope: {
                q: '=q',
                TVDB_ID: '=tvdbid'
            },
            template: '<a class="torrent-dialog" ng-click="openDialog()" tooltip="{{getTooltip()}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
            controller: ["$scope",
                function($scope) {
                    // Translates the tooltip
                    $scope.getTooltip = function() {
                        return $scope.q !== undefined ?
                            $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + $scope.q :
                            $filter('translate')('TORRENTDIALOG/search-download-any/tooltip');
                    }
                    // Opens the torrent search with the episode selected
                    $scope.openDialog = function() {
                        TorrentDialog.search($scope.q, $scope.TVDB_ID);
                    }
                }
            ]
        }
    }
])


.run(["TorrentDialog", "SettingsService",
    function(TorrentDialog, SettingsService) {
        // delay for 500ms so that custom clients can register themselves before determining default enigne. 
        setTimeout(function() {

            var providers = TorrentDialog.getSearchEngines();
            if (!(SettingsService.get('torrenting.searchprovider') in providers)) {
                // autoconfig migration, fallback to first provider in the list when we detect an invalid provider.
                console.warn("Invalid search provider detected: ", SettingsService.get('torrenting.searchprovider'), " defaulting to ", Object.keys(providers)[0]);
                SettingsService.set('torrenting.searchprovider', Object.keys(providers)[0]);
            }
            TorrentDialog.setDefault(SettingsService.get('torrenting.searchprovider'));

        }, 500);
    }
])