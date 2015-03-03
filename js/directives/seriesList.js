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

.directive('seriesList', function() {
    return {
        restrict: 'E',
        controller: 'seriesListCtrl',
        link: function($scope, iElement, iAttrs, controller) {

            var timeout = null;

            $scope.setWidthMinus = function(minus) {
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
        }
    }
})