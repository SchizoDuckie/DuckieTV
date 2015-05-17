/**
 * The <mouse-wheel-up> directive lets you bind expressions to a mouse wheel scrolling up event.
 */
DuckieTV.directive('mouseWheelUp', function () {
    return function (scope, element, attrs) {
        element.bind("mousewheel", function (event) {
            var delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));
            if (delta > 0) {
                scope.$apply(function () {
                    scope.$eval(attrs.mouseWheelUp);
                });
                event.preventDefault();
            }
        });
    };
});
