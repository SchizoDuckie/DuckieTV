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
        controller: function($scope, SidePanelState) {
            var posterWidth, posterHeight, postersPerRow, centeringOffset, verticalOffset, oldClientWidth;
            var el = document.querySelector('[series-grid]');

            // ease in out function thanks to:
            // http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
            var easeInOutCubic = function(t) {
                return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            };

            var position = function(start, end, elapsed, duration) {
                if (elapsed > duration) return end;
                return start + (end - start) * easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
            };

            var smoothScroll = function(parent, el, duration) {
                if (el === null || !el.offsetParent || !el.offsetParent.offsetParent) {
                    return;
                }
                duration = duration || 500;
                var start = parent.scrollTop;
                var end = el.offsetParent.offsetParent.offsetTop;
                var clock = Date.now();
                var step = function() {
                    var elapsed = Date.now() - clock;
                    parent.scrollTop = position(start, end, elapsed, duration);
                    if (elapsed < duration) {
                        window.requestAnimationFrame(step);
                    }
                };
                step();
            };

            var activeScroller = null;

            scrollToActive = function() {
                clearTimeout(activeScroller);
                activeScroller = setTimeout(function() {
                    smoothScroll(el, document.querySelector('serieheader .active'));
                }, 800);
            };

            this.smoothScrollTo = function() {
                scrollToActive();
            };

            function recalculate() {
                var isMini = el.classList.contains('miniposter');
                posterWidth = isMini ? 140 : 170;
                posterHeight = isMini ? 205 : 250;
                oldClientWidth = el.clientWidth;
                verticalOffset = el.getAttribute('vertical-offset') ? parseInt(el.getAttribute('vertical-offset')) : 70;
                horizontalOffset = el.getAttribute('horizontal-offset') ? parseInt(el.getAttribute('horizontal-offset')) : 100;
                postersPerRow = Math.floor(el.clientWidth / posterWidth);
                centeringOffset = (el.clientWidth - (postersPerRow * posterWidth)) / 2;
                scrollToActive();
            }

            var observer = new MutationObserver(function(mutations) {
                recalculate();
                scrollToActive();
                $scope.$applyAsync();
            });

            // configuration of the observer:
            var config = {
                attributes: true
            };

            observer.observe(el, config);
            observer.observe(document.querySelector('sidepanel'), config);

            this.getLeft = function(idx) {
                if (idx === 0 && oldClientWidth != el.clientWidth) {
                    recalculate();
                }
                return centeringOffset + (idx % postersPerRow) * posterWidth;
            };
            this.getTop = function(idx) {
                if (idx === 0 && oldClientWidth != el.clientWidth) {
                    recalculate();
                }
                idx = idx + 1;
                return (Math.ceil(idx / postersPerRow) * posterHeight) - posterHeight + verticalOffset;
            };
        }
    };
});