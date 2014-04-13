angular.module('DuckieTV.controllers.chromecast', ['DuckieTV.providers.chromecast'])


/**
 * ChromeCast controller. Can fire off ChromeCast initializer
 */
.controller('ChromeCastCtrl', function($scope, DuckieTVCast) {

    $scope.Connect = function() {
        console.log('connecting!');
        DuckieTVCast.initialize();
    }

});