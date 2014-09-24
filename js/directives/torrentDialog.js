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
    .controller('torrentDialogCtrl', function($scope, $rootScope, $modalInstance, $injector, data, TorrentDialog) {
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
                epi: '=epi',
                TVDB_ID: '=tvdbid',
                SerieID: '=serieid',
                SerieName: '=seriename'
            },
            template: '<a ng-click="openDialog()" tooltip="{{tooltip}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
            controller: function($scope) {
                getName = function(epi, serieid, name) {
                    var serieName = SceneNameResolver.getSceneName(serieid) || name;
                    return serieName.replace(/\(([12][09][0-9]{2})\)/, '').replace(' and ', ' ') + ' ' + epi;
                };
                $scope.tooltip = getName($scope.epi, $scope.SerieID, $scope.SerieName) !== undefined ?
                    $filter('translate')('TORRENTDIALOG/search-download-this/tooltip') + getName($scope.epi, $scope.SerieID, $scope.SerieName) :
                    $filter('translate')('TORRENTDIALOG/search-download-any/tooltip');
                $scope.openDialog = function() {
                    TorrentDialog.search(getName($scope.epi, $scope.SerieID, $scope.SerieName), $scope.TVDB_ID);
                }
            }
        }
    })
