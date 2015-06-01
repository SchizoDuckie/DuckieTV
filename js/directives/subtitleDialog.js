DuckieTV.provider('SubtitleDialog', function() {
    this.$get = ["$injector", "$rootScope", "$q",
        function($injector, $rootScope, $q) {
            // all web-enabled languages on 

            return {
                search: function(string) {
                    return $injector.get('$dialogs').create('templates/subtitleDialog.html', 'subtitleDialogCtrl', {
                        query: '',
                    }, {
                        size: 'lg'
                    });
                },
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

        $scope.episode = ('episode' in data) ? data.episode : null;
        $scope.serie = ('serie' in data) ? data.serie : null;
        $scope.query = ('query' in data) ? data.query : '';
        if ($scope.episode && $scope.serie) {
            $scope.query = $scope.serie.name + ' ' + $scope.episode.title;
        }

        $scope.search = function(query) {
            $scope.searching = true;
            var promise = null;
            $scope.query = query || '';
            if ($scope.serie && $scope.episode && $scope.query === $scope.serie.name + ' ' + $scope.episode.title) {
                promise = OpenSubtitles.searchEpisode($scope.serie, $scope.episode);
            } else {
                promise = OpenSubtitles.searchString($scope.query);
            }

            promise.then(function(results) {
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
            replace: true,
            scope: {
                serie: '=serie',
                seasonNumber: '=seasonNumber',
                episodeNumber: '=episodeNumber'
            },
            template: '<a class="subtitle-dialog" ng-click="openDialog()" tooltip="{{getTooltip()}}"><i class="glyphicon glyphicon-text-width"></i><span ng-transclude></span></a>',
            controller: ["$scope",
                function($scope) {
                    // Translates the tooltip
                    $scope.getTooltip = function() {
                        return $scope.serie !== undefined ? 
                        $filter('translate')('SUBTITLEDIALOGjs/find-subtitle-for/tooltip') + $scope.serie.name :
                        $filter('translate')('SUBTITLEDIALOGjs/find-subtitle/tooltip');
                    }
                    $scope.openDialog = function() {
                        if ($scope.serie && $scope.seasonNumber && $scope.episodeNumber) {
                            SubtitleDialog.search($scope.serie, $scope.seasonNumber, $scope.episodeNumber);
                        } else {
                            SubtitleDialog.search('');
                        }
                    };
                }
            ]
        };
    }
]);