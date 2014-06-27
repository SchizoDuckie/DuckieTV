angular.module('DuckieTV.directives.torrentdialog', ['dialogs'])
    .provider('TorrentDialog', function() {
        this.$get = function($dialogs) {
            return {
                search: function(query, TVDB_ID, options) {
                    return $dialogs.create('templates/torrentDialog.html', 'torrentDialogCtrl', {
                        query: query,
                        TVDB_ID: TVDB_ID
                    }, options || {});
                }
            }
        }
    })
    .controller('torrentDialogCtrl', function($scope, $rootScope, $modalInstance, $injector, data) {
        //-- Variables --//

        $scope.items = [];
        $scope.searching = true;
        $scope.query = angular.copy(data.query);
        $scope.TVDB_ID = angular.copy(data.TVDB_ID);
        $scope.searchprovider = $scope.getSetting('torrenting.searchprovider');
        $scope.searchquality = $scope.getSetting('torrenting.searchquality');

        $scope.search = function(q, TVDB_ID) {
            $scope.query = q;
            if (TVDB_ID !== undefined) {
                $scope.TVDB_ID = TVDB_ID;
            }
            $injector.get($scope.searchprovider).search([q, $scope.searchquality].join(' ')).then(function(results) {
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
            console.log("Magnet broadcast channel: ", 'magnet:select:' + channel);
            $rootScope.$broadcast('magnet:select:' + channel, magnet.match(/([0-9ABCDEFabcdef]{40})/)[0].toUpperCase());

            var d = document.createElement('iframe');

            d.id = 'torrentmagnet_' + new Date().getTime();
            document.body.appendChild(d);
            d.src = magnet;
            d.style.visibility = 'hidden';
            setTimeout(function() {
                document.body.removeChild(document.getElementById(d.id));
            }, 1000);
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
            template: '<a ng-click="openDialog()" tooltip="{{tooltip}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
            controller: function($scope) {
                $scope.tooltip = $scope.q !== undefined ? 
                    $filter('translate')('TORRENTDIALOG-search-download-this-tooltip') + $scope.q :
                    $filter('translate')('TORRENTDIALOG-search-download-any-tooltip');
                $scope.openDialog = function() {
                    TorrentDialog.search($scope.q, $scope.TVDB_ID);
                }
            }
        }
    })
