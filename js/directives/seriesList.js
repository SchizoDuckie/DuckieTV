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
        controller: function($scope, SidePanelState, SettingsService) {
            if (SettingsService.get('library.seriesgrid') == false) {
                return;
            }
            var posterWidth, posterHeight, postersPerRow, centeringOffset, verticalOffset, oldClientWidth;
            var container = document.querySelector('[series-grid]');
            var el = container.querySelector('.series-grid');
            var noScroll = container.hasAttribute('no-scroll');

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
                if (el === null || !el.offsetParent || !el.offsetParent.offsetParent || noScroll) {
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
                    smoothScroll(container, el.querySelector('serieheader .active'));
                }, 800);
            };

            this.smoothScrollTo = function() {
                scrollToActive();
            };

            function recalculate() {
                var isMini = container.classList.contains('miniposter');
                var maxPosters = container.getAttribute('max-posters') ? parseInt(container.getAttribute('max-posters')) : 0;
                posterWidth = isMini ? 140 : 175; // Includes paddings
                posterHeight = isMini ? 206 : 258; // Includes paddings
                oldClientWidth = el.clientWidth;
                postersPerRow = Math.floor(el.clientWidth / posterWidth);
                centeringOffset = (el.clientWidth - (postersPerRow * posterWidth)) / 2;

                if (maxPosters != 0) {
                    el.style.height = (Math.ceil(maxPosters / postersPerRow) * posterHeight)+'px';
                }
                $scope.$applyAsync();
                scrollToActive();
            }

            var observer = new MutationObserver(function(mutations) {
                recalculate();
            });

            // configuration of the observer:
            var config = {
                attributes: true
            };

            observer.observe(container, config);
            observer.observe(document.querySelector('sidepanel'), config);

            this.getLeft = function(idx, max) {
                if (idx === 0 && oldClientWidth != el.clientWidth) {
                    recalculate();
                }
                var rowCentering = 0;
                var leftovers = max - (max % postersPerRow);
                if (max < postersPerRow || idx >= leftovers) { // if we're on the last line
                    var postersInRow = max < postersPerRow ? max : max - leftovers;
                    rowCentering = (el.clientWidth / 2) - ((postersInRow * posterWidth) / 2) - rowCentering;
                    var positionInRow = postersInRow - (max - idx);
                    return rowCentering + (positionInRow * posterWidth);
                } else {
                    return centeringOffset + rowCentering + ((idx % postersPerRow) * posterWidth);
                }
            };

            this.getTop = function(idx) {
                if (idx === 0 && oldClientWidth != el.clientWidth) {
                    recalculate();
                }
                idx = idx + 1;
                return (Math.ceil(idx / postersPerRow) * posterHeight) - posterHeight;
            };
        }
    };
});