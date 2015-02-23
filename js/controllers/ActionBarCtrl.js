angular.module('DuckieTV.controllers.actionbar', [])

/**
 * Watchlist controller for movies
 * Currently not implemented
 */

.controller('ActionBarCtrl', ["$scope", "$rootScope",
    function($scope, $rootScope) {

        $scope.toggleSeriesList = function() {
            $rootScope.$broadcast('serieslist:toggle');
        };

    }
])