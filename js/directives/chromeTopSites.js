angular.module('DuckieTV.directives.chrometopsites', ['DuckieTV.directives.lazybackground'])
/**
 * Standalone Chrome Top Site list generator.
 * Provides the <chrome-top-sites> directive
 * That displays your most visited sites
 */

.provider('ChromeTopSites', function() {

    this.$get = function($q) {
        return {
            getTopSites: function() {
                var p = $q.defer();
                if (('topSites' in window.chrome)) {
                    chrome.topSites.get(function(result) {
                        console.log("Topsites result just came in ", result);
                        p.resolve(result);
                    });
                } else {
                    p.reject();
                }

                return p.promise;
            }
        }
    }
})

.controller('ChromeTopSitesCtrl', function($scope, ChromeTopSites) {

    $scope.topSites = [];

    ChromeTopSites.getTopSites().then(function(result) {
        $scope.topSites = result;
    });
})


/**
 * <chrome-top-sites> directive that shows the list
 */
.directive('chromeTopSites', function() {

    return {
        restrict: 'E',
        templateUrl: 'templates/chrome-top-sites.html'
    };
});