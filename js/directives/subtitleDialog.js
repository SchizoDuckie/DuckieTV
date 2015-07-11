DuckieTV.provider('SubtitleDialog', function() {
    this.$get = ["$injector", "$rootScope", "$q",
        function($injector, $rootScope, $q) {
            // all web-enabled languages on 

            return {
                search: function(str) {
                    return $injector.get('dialogs').create('templates/subtitleDialog.html', 'subtitleDialogCtrl', {
                        query: str
                    }, {
                        size: 'lg'
                    });
                },
                searchFilename: function(filename) {
                    return $injector.get('dialogs').create('templates/subtitleDialog.html', 'subtitleDialogCtrl', {
                        filename: filename
                    }, {
                        size: 'lg'
                    });
                },
                searchEpisode: function(serie, episode) {
                    return $injector.get('dialogs').create('templates/subtitleDialog.html', 'subtitleDialogCtrl', {
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

.controller('subtitleDialogCtrl', ["$scope", "$rootScope", "$modalInstance", "$injector", "data", "OpenSubtitles", "SettingsService", "SceneNameResolver",
    function($scope, $rootScope, $modalInstance, $injector, data, OpenSubtitles, SettingsService, SceneNameResolver) {
        //-- Variables --//

        var customClients = {};
        var searchType = 2; // 0 = custom, 1 = episode, 2 = filename

        $scope.items = [];
        $scope.searching = true;

        $scope.episode = ('episode' in data) ? data.episode : null;
        $scope.serie = ('serie' in data) ? data.serie : null;
        $scope.query = ('query' in data) ? data.query : '';
        $scope.filename = ('filename' in data) ? data.filename : null;

        if ($scope.filename !== null) {
            $scope.query = $scope.filename;
            searchType = 2;
        };
        if ($scope.episode && $scope.serie) {
            $scope.query = SceneNameResolver.getSceneName($scope.serie.TVDB_ID, $scope.serie.name) + ' ' + SceneNameResolver.getSearchStringForEpisode($scope.serie, $scope.episode);
            searchType = 1;
        };
        $scope.search = function(query) {
            $scope.searching = true;
            var promise = null;
            if (query) {
                $scope.query = query;
                searchType = 0;
            };

            if (searchType == 1) {
                promise = OpenSubtitles.searchEpisode($scope.serie, $scope.episode);
            } else if (searchType == 2) {
                promise = OpenSubtitles.searchFilename($scope.filename);
            } else {
                promise = OpenSubtitles.searchString($scope.query);
            };

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
                episodeNumber: '=episodeNumber',
                filename: '=filename'
            },
            template: '<a class="subtitle-dialog" ng-click="openDialog()" tooltip="{{getTooltip()}}"><i class="glyphicon glyphicon-text-width"></i><span ng-transclude></span></a>',
            controller: ["$scope",
                function($scope) {
                    // Translates the tooltip
                    $scope.getTooltip = function() {
                        return $scope.serie !== undefined ?
                            $filter('translate')('SUBTITLEDIALOGjs/find-subtitle-for/tooltip') + $scope.serie.name :
                            $filter('translate')('SUBTITLEDIALOGjs/find-subtitle/tooltip');
                    };
                    $scope.openDialog = function() {
                        if ($scope.serie && $scope.seasonNumber && $scope.episodeNumber) {
                            SubtitleDialog.search($scope.serie, $scope.seasonNumber, $scope.episodeNumber);
                        } else {
                            if ($scope.filename) {
                                SubtitleDialog.search($scope.filename);
                            } else {
                                SubtitleDialog.search('');
                            }
                        }
                    };
                }
            ]
        };
    }
]);