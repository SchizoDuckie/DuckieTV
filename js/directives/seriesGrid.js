DuckieTV.directive('seriesGrid', function() {
    return {
        restrict: 'A',
        controllerAs: 'grid',
        controller: ["$scope", "SidePanelState", "SettingsService", function($scope, SidePanelState, SettingsService) {
            var posterWidth, posterHeight, postersPerRow, centeringOffset, verticalOffset, oldClientWidth;
            var container = document.querySelector('[series-grid]');
            var seriesGrid = container.querySelector('.series-grid');
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

            var smoothScroll = function(el, duration) {
                if (!el || noScroll) {
                    return;
                }
                duration = duration || 350;
                var start = container.scrollTop;
                var end;
                if (SettingsService.get('library.seriesgrid') == true) {
                    end = parseInt(el.parentElement.style.transform.replace('translate3d(', '').split(',')[1].slice(1, -2)) - 150;
                } else {
                    end = el.offsetTop;
                }
                var clock = Date.now();
                var step = function() {
                    var elapsed = Date.now() - clock;
                    container.scrollTop = position(start, end, elapsed, duration);
                    if (elapsed < duration) {
                        window.requestAnimationFrame(step);
                    }
                };
                step();
            };

            var activeScroller = null;

            var scrollToActive = function() {
                clearTimeout(activeScroller);
                activeScroller = setTimeout(function() {
                    smoothScroll(seriesGrid.querySelector('.serieheader.active'));
                }, 800);
            };

            function recalculate() {
                if (SettingsService.get('library.seriesgrid') == false) {
                    return scrollToActive();
                }
                var isMini = container.classList.contains('miniposter');
                var maxPosters = container.getAttribute('max-posters') ? parseInt(container.getAttribute('max-posters')) : 0;
                posterWidth = isMini ? 140 : 175; // Includes paddings
                posterHeight = isMini ? 197 : 247; // Includes paddings
                oldClientWidth = seriesGrid.clientWidth;
                postersPerRow = Math.floor(seriesGrid.clientWidth / posterWidth);
                centeringOffset = (seriesGrid.clientWidth - (postersPerRow * posterWidth)) / 2;

                if (maxPosters != 0) {
                    seriesGrid.style.height = (Math.ceil(maxPosters / postersPerRow) * posterHeight) + 'px';
                }

                $scope.$applyAsync();
                scrollToActive();
            }

            var observer = new MutationObserver(function() {
                recalculate();
            });

            // configuration of the observer:
            var config = {
                attributes: true
            };

            observer.observe(container, config);
            observer.observe(document.querySelector('sidepanel'), config);

            this.getPosition = function(idx, max) {
                return 'transform: translate3d(' + getLeft(idx, max) + 'px, ' + getTop(idx) + 'px, 0px)';
            };

            var getLeft = function(idx, max) {
                if (idx === 0 && oldClientWidth != seriesGrid.clientWidth) {
                    recalculate();
                }
                var rowCentering = 0;
                var leftovers = max - (max % postersPerRow);
                if (max < postersPerRow || idx >= leftovers) { // if we're on the last line
                    var postersInRow = max < postersPerRow ? max : max - leftovers;
                    rowCentering = (seriesGrid.clientWidth / 2) - ((postersInRow * posterWidth) / 2) - rowCentering;
                    var positionInRow = postersInRow - (max - idx);
                    return rowCentering + (positionInRow * posterWidth);
                } else {
                    return centeringOffset + rowCentering + ((idx % postersPerRow) * posterWidth);
                }
            };

            var getTop = function(idx) {
                if (idx === 0 && oldClientWidth != seriesGrid.clientWidth) {
                    recalculate();
                }
                idx = idx + 1;
                return (Math.ceil(idx / postersPerRow) * posterHeight) - posterHeight;
            };
        }]
    };
});