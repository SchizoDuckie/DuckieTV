DuckieTV.factory('SeriesListState', ["$rootScope",

    function($rootScope) {
        var service = {
            state: {
                isShowing: false,
                isExpanded: false
            },
            show: function() {
                document.body.style.overflowY = 'hidden';
                document.body.scrollTop = 0;
                service.state.isShowing = true;
                $rootScope.$applyAsync();
            },
            hide: function() {
                document.body.style.overflowY = 'auto';
                service.state.isShowing = false;
                $rootScope.$applyAsync();
            },
            toggle: function() {
                service.state.isShowing = !service.state.isShowing;
                $rootScope.$applyAsync();
            }
        };
        return service;
    }
])

.directive('seriesList', function() {
    return {
        restrict: 'E',
        controller: 'seriesListCtrl',
        controllerAs: 'serieslist',
        bindToController: true
    }
})