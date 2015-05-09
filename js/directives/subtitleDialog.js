DuckieTV.provider('SubtitleDialog', function() {
    this.$get = ["$injector", "$rootScope", "$q",
        function($injector, $rootScope, $q) {
            return {
                searchEpisode: function(serie, episode) {
                    return $injector.get('$dialogs').create('templates/subtitleDialog.html', 'subtitleDialogCtrl', {
                        serie: serie,
                        episode: episode
                    }, {
                        size: 'lg'
                    });
                }
            };
        }
    ];
})

.controller('subtitleDialogCtrl', ["$scope", "$rootScope", "$modalInstance", "$injector", "data", "OpenSubtitles", "SettingsService",
    function($scope, $rootScope, $modalInstance, $injector, data, OpenSubtitles, SettingsService) {
        //-- Variables --//

        var customClients = {};

        $scope.items = [];
        $scope.searching = true;
        $scope.episode = data.episode;
        $scope.serie = data.serie;


        $scope.search = function() {
            $scope.searching = true;

            OpenSubtitles.searchEpisode($scope.serie, $scope.episode).then(function(results) {
                    $scope.items = results;
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


        $scope.cancel = function() {
            $modalInstance.dismiss('Canceled');
        };

        $scope.search();

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