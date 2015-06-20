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
            var posterWidth, posterHeight, postersPerRow, centeringOffset;
            var el = document.querySelector('[series-grid]');

            function recalculate() {
                var isMini = el.classList.contains('miniposter');
                posterWidth = isMini ? 140 : 170;
                posterHeight = isMini ? 205 : 250;
                centeringOffset = 20;
                postersPerRow = Math.floor((el.clientWidth - (centeringOffset * 2)) / posterWidth);
            }

            this.getLeft = function(idx) {
                if (idx === 0) {
                    recalculate();
                }
                return centeringOffset + (idx % postersPerRow) * posterWidth;
            };
            this.getTop = function(idx) {
                if (idx === 0) {
                    recalculate();
                }
                idx = idx + 1;
                return (Math.ceil(idx / postersPerRow) * posterHeight) - centeringOffset;
            };
        }
    };

});