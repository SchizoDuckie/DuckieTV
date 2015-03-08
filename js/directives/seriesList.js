DuckieTV.factory('SeriesListState', ["$rootScope", "FavoritesService", "$state",

    function($rootScope, FavoritesService, $state) {
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
                if (!service.state.isShowing) {
                    service.show();
                } else {
                    service.hide();
                }
                $rootScope.$applyAsync();
            }
        };
        return service;
    }
])

.directive('seriesList', function() {
    return {
        restrict: 'E'
    }
})