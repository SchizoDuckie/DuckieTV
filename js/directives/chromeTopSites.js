/**
 * Standalone Chrome Top Site list generator.
 * Provides the <chrome-top-sites> directive
 * That displays your most visited sites
 */
DuckieTV.provider('ChromeTopSites', function() {

    this.$get = ["$q",
        function($q) {
            return {
                /**
                 * Service wrapper round chrome's topSites API that provides a promise
                 * that's resolved when topistes are fetched.
                 * If current environment is not chrome then the promise is rejected.
                 */
                getTopSites: function() {
                    var p = $q.defer();
                    if (('chrome' in window && 'topSites' in window.chrome)) {
                        chrome.topSites.get(function(result) {
                            p.resolve(result);
                        });
                    } else {
                        p.reject();
                    }
                    return p.promise;
                }
            }
        }
    ]
})

/**
 * <chrome-top-sites> directive that shows the list of most visited
 * sites in chrome
 */
.directive('chromeTopSites', ["ChromeTopSites",
    function(ChromeTopSites) {
        return {
            restrict: 'E',
            templateUrl: 'templates/chrome-top-sites.html',
            link: function($scope, iElement) {
                $scope.topSites = [];
                ChromeTopSites.getTopSites().then(function(result) {
                    $scope.topSites = result;
                });

                //Toggles the TopSites Panel
                $scope.isShowing = false;
                $scope.toggleTop = function() {
                    if ($scope.isShowing) {
                        $scope.isShowing = false;
                        iElement.removeClass('active');
                    } else {
                        $scope.isShowing = true;
                        iElement.addClass('active');
                    }
                }
            }
        }
    }
]);