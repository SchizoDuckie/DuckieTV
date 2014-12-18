angular.module('DuckieTV.directives.torrentdialog', [])
    .provider('TorrentDialog', function() {
        var activeMagnet = false;
        this.$get = function($injector, $rootScope, $q) {
            return {
                search: function(query, TVDB_ID, options) {
                    return $injector.get('$dialogs').create('templates/torrentDialog.html', 'torrentDialogCtrl', {
                        query: query,
                        TVDB_ID: TVDB_ID
                    }, options || {});
                },
                /**
                 * launch magnet via a hidden iframe and broadcast the fact that it's selected to anyone listening
                 */
                launchMagnet: function(magnet, TVDB_ID) {
                    console.log("Firing magnet URI! ", magnet, TVDB_ID);
                    $rootScope.$broadcast('magnet:select:' + TVDB_ID, magnet.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());
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
        }
    })
    .controller('torrentDialogCtrl', function($scope, $rootScope, $modalInstance, $injector, data, TorrentDialog, GenericSearch) {
        //-- Variables --//

        $scope.items = [];
        $scope.searching = true;
        $scope.query = angular.copy(data.query);
        $scope.TVDB_ID = angular.copy(data.TVDB_ID);
        $scope.searchprovider = $scope.getSetting('torrenting.searchprovider');
        $scope.searchquality = $scope.getSetting('torrenting.searchquality');

        $scope.getName = function(provider) {
            return provider.replace('GenericSearch.', '');
        };

        $scope.search = function(q, TVDB_ID) {
            $scope.searching = true;
            $scope.query = q;
            if (TVDB_ID !== undefined) {
                $scope.TVDB_ID = TVDB_ID;
            }


            GenericSearch.search([q, $scope.searchquality].join(' ')).then(function(results) {
                $scope.items = results;
                $scope.searching = false;
            }, function(e) {
                $scope.searching = false;
            });

        }

        $scope.setQuality = function(quality) {
            $scope.searchquality = quality;
            $scope.search($scope.query);
        }

        $scope.setProvider = function(provider) {
            $scope.searchprovider = provider;
            GenericSearch.setProvider(provider);
            $scope.search($scope.query);
        }

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        $scope.save = function() {
            $modalInstance.close($scope.user.name);
        };

        $scope.hitEnter = function(evt) {
            if (angular.equals(evt.keyCode, 13) && !(angular.equals($scope.user.name, null) || angular.equals($scope.user.name, '')))
                $scope.save();
        };

        $scope.magnetSelect = function(magnet) {
            console.log("Magnet selected!", magnet);
            $modalInstance.close(magnet);

            var channel = $scope.TVDB_ID !== null ? $scope.TVDB_ID : $scope.query;
            TorrentDialog.launchMagnet(magnet, channel);
        }


        $scope.search($scope.query);

    })
    .directive('torrentDialog', function(TorrentDialog, $filter) {
        return {
            restrict: 'E',
            transclude: true,
            wrap: true,
            scope: {
                q: '=q',
                TVDB_ID: '=tvdbid'
            },
            template: '<a ng-click="openDialog()" tooltip-append-to-body=true tooltip="{{tooltip}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
            controller: function($scope) {
                $scope.tooltip = $scope.q !== undefined ?
                    $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + $scope.q :
                    $filter('translate')('TORRENTDIALOG/search-download-any/tooltip');
                $scope.openDialog = function() {
                    TorrentDialog.search($scope.q, $scope.TVDB_ID);
                }
            }
        }
    })