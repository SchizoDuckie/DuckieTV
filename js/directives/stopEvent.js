DuckieTV
/**
 * A little directive to stop event propagation for elements with ng-click inside ng-click.
 * Add as attribute to the element you don't want to have it's click event bubbled.
 */
.directive('stopEvent', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            element.bind('click', function(e) {
                e.stopPropagation();
            });
        }
    };
});