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
        controller: 'seriesListCtrl'
    }
})