/**
 * Controller for Sync settings tab
 */
DuckieTV.controller('SyncCtrl', ["$scope", "StorageSyncService", "$injector", "TraktTVv2",
    function($scope, StorageSyncService, $injector, TraktTVv2) {

        $scope.targets = StorageSyncService.targets;

        $scope.read = function(StorageEngine) {
            StorageEngine.getSeriesList().then(function(result) {
                StorageEngine.series = [];
                result.map(function(TVDB_ID) {
                    return TraktTVv2.resolveTVDBID(TVDB_ID).then(function(searchResult) {
                        return TraktTVv2.serie(searchResult.slug_id);
                    }).then(function(serie) {
                        StorageEngine.series.push(serie);
                    });
                });
            });
        };

        $scope.compare = function(StorageEngine) {
            StorageSyncService.compareTarget(StorageEngine, true);
        };

        console.log($scope.targets);
    }
])