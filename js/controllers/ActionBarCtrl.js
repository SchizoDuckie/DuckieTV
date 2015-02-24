angular.module('DuckieTV.controllers.actionbar', [])

/**
 * Actionbar Controller
 */

.controller('ActionBarCtrl', ["$scope", "$rootScope",
    function($scope, $rootScope) {

        $scope.hideSeriesList = function() {
            $rootScope.$broadcast('serieslist:hide');
        };

        $scope.toggleSeriesList = function() {
            $rootScope.$broadcast('serieslist:toggle');
        };

    }
])