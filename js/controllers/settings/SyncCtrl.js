/**
 * Controller for Sync settings tab
 * *************** NOT IN USE ************************
 */
DuckieTV.controller('SyncCtrl', ['$scope', 'StorageSyncService', 'TraktTVv2',
  function($scope, StorageSyncService, TraktTVv2) {
    $scope.targets = StorageSyncService.targets

    $scope.read = function(StorageEngine) {
      StorageEngine.getSeriesList().then(function(result) {
        StorageEngine.series = []
        result.map(function(TRAKT_ID) {
          return TraktTVv2.resolveID(TRAKT_ID, true).then(function(searchResult) {
            return TraktTVv2.serie(searchResult.trakt_id)
          }).then(function(serie) {
            StorageEngine.series.push(serie)
          })
        })
      })
    }

    $scope.compare = function(StorageEngine) {
      StorageSyncService.compareTarget(StorageEngine, true)
    }

    console.log($scope.targets)
  }
])
