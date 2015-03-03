DuckieTV
DuckieTV.factory('SeriesListState', function() {

    var service = {
        state: {
            isShowing: false,
            isExpanded: false
        },
        show: function() {
            document.body.style.overflowY = 'hidden';
            document.body.scrollTop = 0;
            service.state.isShowing = true;
        },
        hide: function() {
            document.body.style.overflowY = 'auto';
            service.state.isShowing = false;
        },
        toggle: function() {
            service.state.isShowing = !service.state.isShowing;
        }
    };
    return service;
})

.directive('seriesList', function(SidePanelState, SeriesListState) {
    return {
        restrict: 'E',
        controller: 'seriesListCtrl',
        link: function($scope, iElement, iAttrs, controller) {

            var timeout = null;

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
                if (!SeriesListState.state.isShowing) return;
                if (newValue[0].object.isExpanded) {
                    setWidthMinus(800);
                } else if (newValue[0].object.isShowing) {
                    setWidthMinus(400);
                } else {
                    setWidthMinus(0)
                }
                $scope.$applyAsync();
            });
        }
    }
})

/**
 * <chrome-top-sites> directive that shows the list of most visited
 * sites in chrome
 */
.directive('clicktrap', ["SidePanelState",
    function(SidePanelState) {
        return {
            restrict: 'E',
            link: function($scope, iElement) {
                iElement[0].onclick = function() {
                    debugger;
                    if (SidePanelState.state.isShowing) {
                        SidePanelState.hide();
                    }
                }
            }
        }
    }
]);