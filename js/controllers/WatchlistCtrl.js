/**
 * Watchlist controller for movies
 * Currently not implemented
 */

DuckieTV.controller('WatchlistCtrl', ["$scope", "WatchlistService",
    function($scope, WatchlistService) {

        $scope.watchlist = WatchlistService.watchlist;
        $scope.searchEngine = 1;
        $scope.searchingForMovie = false;

        $scope.enableAdd = function() {
            $scope.searchingForMovie = true;
        }

        $scope.disableAdd = function() {
            $scope.searchingForMovie = false;
        }

        $scope.$on('watchlist:updated', function(event, data) {
            // you could inspect the data to see if what you care about changed, or just update your own scope
            $scope.watchlist = data;
            console.log("Watchlist came in!", $scope.watchlist, data);
            if (!$scope.watchlist || (data.watchlist && data.watchlist.length == 0)) {
                $scope.enableAdd();
            }
            $scope.$digest(); // notify the scope that new data came in
        });


    }
])