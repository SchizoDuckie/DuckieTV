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
                document.querySelector('#actionbar_favorites').classList.add('active');
                $rootScope.$applyAsync();
            },
            hide: function() {
                document.body.style.overflowY = 'auto';
                service.state.isShowing = false;
                $rootScope.$applyAsync();
                document.querySelector('#actionbar_favorites').classList.remove('active');
                document.querySelector('#actionbar_favorites').classList.remove('spin');
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
    };
})

.directive('seriesGrid', function() {

    return {
        restrict: 'A',
        controllerAs: 'grid',
        controller: function($scope) {
            var posterWidth = 140;
            var posterHeight = 205;
            var el = document.querySelector('[series-grid]');

            this.getLeft = function(idx) {
                return 75 + (idx % Math.round((el.clientWidth - 150) / posterWidth)) * posterWidth;
            };
            this.getTop = function(idx) {
                idx = idx + 1;
                return (Math.ceil(idx / Math.round((el.clientWidth - 150) / posterWidth)) * posterHeight) - 75;

            };
        }
    };

});