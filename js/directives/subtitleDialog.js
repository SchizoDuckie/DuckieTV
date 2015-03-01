DuckieTV.provider('SubtitleDialog', function() {
    this.$get = ["$injector", "$rootScope", "$q",
        function($injector, $rootScope, $q) {
            return {
                search: function(serie, seasonNumber, episodeNumber) {
                    return $injector.get('$dialogs').create('templates/subtitleDialog.html', 'subtitleDialogCtrl', {
                        serie: serie,
                        seasonNumber: seasonNumber,
                        episodeNumber: episodeNumber
                    }, {
                        size: 'lg'
                    });
                }
            };
        }
    ];
})

.controller('subtitleDialogCtrl', ["$scope", "$rootScope", "$modalInstance", "$injector", "data", "Addic7ed", "SettingsService",
    function($scope, $rootScope, $modalInstance, $injector, data, Addic7ed, SettingsService) {
        //-- Variables --//

        var customClients = {};

        $scope.items = [];
        $scope.searching = true;
        $scope.serie = data.serie;
        $scope.seasonNumber = angular.copy(data.seasonNumber);
        $scope.episodeNumber = angular.copy(data.episodeNumber);
        $scope.searchquality = $scope.getSetting('torrenting.searchquality');


        $scope.fetch = function() {
            // needs iframe solution.
        }
        $scope.search = function() {
            $scope.searching = true;

            Addic7ed.search($scope.serie, $scope.seasonNumber, $scope.episodeNumber, $scope.searchquality).then(function(results) {
                    $scope.items = results;
                    console.log(results);
                    $scope.searching = false;
                },
                function(e) {
                    $scope.searching = false;
                });
        };

        $scope.setQuality = function(quality) {
            $scope.searchquality = quality;
            $scope.search($scope.query);
        };

        $scope.setProvider = function(provider) {
            $scope.searchprovider = provider;
            if (!(provider in customClients)) {
                GenericSearch.setProvider(provider);
            }
            $scope.search($scope.query);
        }

        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        $scope.search($scope.query);

    }
])

.directive('subtitleDialog', ["SubtitleDialog", "$filter",
    function(SubtitleDialog, $filter) {
        return {
            restrict: 'E',
            transclude: true,
            wrap: true,
            scope: {
                serie: '=serie',
                seasonNumber: '=seasonNumber',
                episodeNumber: '=episodeNumber'
            },
            template: '<a ng-click="openDialog()" tooltip-append-to-body=true tooltip="{{tooltip}}"><i class="glyphicon glyphicon-download"></i><span ng-transclude></span></a>',
            controller: ["$scope",
                function($scope) {
                    $scope.tooltip = $scope.serie !== undefined ?
                        'Find a subtitle for ' + $scope.serie.name :
                        'Find a subtitle'
                    $scope.openDialog = function() {
                        SubtitleDialog.search($scope.serie, $scope.seasonNumber, $scope.episodeNumber);
                    }
                }
            ]
        }
    }
]);