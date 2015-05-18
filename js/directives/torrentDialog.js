DuckieTV

.controller('torrentDialogCtrl', ["$scope", "$rootScope", "$modalInstance", "$injector", "data", "TorrentSearchEngines", "SettingsService",
    function($scope, $rootScope, $modalInstance, $injector, data, TorrentSearchEngines, SettingsService) {
        //-- Variables --//

        $scope.items = [];
        $scope.searching = true;
        $scope.error = false;
        $scope.query = angular.copy(data.query);
        $scope.TVDB_ID = angular.copy(data.TVDB_ID);
        $scope.searchprovider = SettingsService.get('torrenting.searchprovider');
        $scope.searchquality = SettingsService.get('torrenting.searchquality');

        $scope.getName = function(provider) {
            return provider;
        };

        $scope.search = function(q, TVDB_ID) {
            $scope.searching = true;
            $scope.error = false;
            $scope.query = q;
            if (TVDB_ID !== undefined) {
                $scope.TVDB_ID = TVDB_ID;
            }

            TorrentSearchEngines.getSearchEngine($scope.searchprovider).search([q, $scope.searchquality].join(' ')).then(function(results) {
                    $scope.items = results;
                    $scope.searching = false;
                },
                function(e) {
                    $scope.searching = false;
                    $scope.error = e;
                    $scope.items = null;
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
            TorrentSearchEngines.launchMagnet(magnet, channel);
        };

        $scope.clients = Object.keys(TorrentSearchEngines.getSearchEngines());

        $scope.search($scope.query);
    }
])

.directive('torrentDialog', ["TorrentSearchEngines", "$filter",
    function(TorrentSearchEngines, $filter) {
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
                        TorrentSearchEngines.search($scope.q, $scope.TVDB_ID);
                    }
                }
            ]
        }
    }
])


.run(["TorrentSearchEngines", "SettingsService",
    function(TorrentSearchEngines, SettingsService) {
        // delay for 500ms so that custom clients can register themselves before determining default enigne. 
        setTimeout(function() {

            var providers = TorrentSearchEngines.getSearchEngines();
            if (!(SettingsService.get('torrenting.searchprovider') in providers)) {
                // autoconfig migration, fallback to first provider in the list when we detect an invalid provider.
                console.warn("Invalid search provider detected: ", SettingsService.get('torrenting.searchprovider'), " defaulting to ", Object.keys(providers)[0]);
                SettingsService.set('torrenting.searchprovider', Object.keys(providers)[0]);
            }
            TorrentSearchEngines.setDefault(SettingsService.get('torrenting.searchprovider'));

        }, 500);
    }
])