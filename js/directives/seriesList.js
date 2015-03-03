DuckieTV.directive('seriesList', function(SidePanelState) {
    return {
        restrict: 'E',
        controller: 'seriesListCtrl',
        link: function($scope, iElement, iAttrs, controller) {

            var timeout = null;;

            function setWidthMinus(minus) {
                if (timeout) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(function() {
                    var serieslist = document.querySelector('series-list > div');
                    if (serieslist) {
                        serieslist.style.width = (document.body.clientWidth - minus) + 'px';
                    }
                }, 0);
            };

            Object.observe(SidePanelState.state, function(newValue) {
                if (newValue[0].object.isExpanded) {
                    setWidthMinus(800);
                } else if (newValue[0].object.isShowing) {
                    setWidthMinus(400);
                } else {
                    setWidthMinus(0)
                }
                $scope.$applyAsync();
            });

            window.addEventListener('resize', function() {
                console.log('window resize!');
                if (SidePanelState.state.isExpanded) {
                    setWidthMinus(800);

                } else if (SidePanelState.isShowing) {
                    setWidthMinus(400);
                } else {
                    setWidthMinus(0);
                }
                $scope.$applyAsync();
            }, false);
        }
    }
})

/**
 * <chrome-top-sites> directive that shows the list of most visited
 * sites in chrome
 */
.directive('clicktrap', ["$state",
    function($state) {
        return {
            restrict: 'E',
            link: function($scope, iElement) {
                iElement[0].onclick = function() {
                    $state.go('calendar');
                }
            }
        }
    }
]);