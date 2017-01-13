/**
 * SchizoDuckie 2014
 * Lazy load background module.
 * Fades in the element that you set the lazy-background property to after the image has been loaded and
 * set as css background image.
 */
DuckieTV.directive('lazyBackground', ["$document", "$parse",
    function($document) {
        return {
            restrict: 'A',
            scope: {
                altMode: '=altLazy'
            },
            link: function($scope, $element, $attrs) {
                var element, elementCont;
                /**
                 * altMode is a seperate loading mode where the lazyBackground directive isn't placed
                 * on the element we're applying the background image. So we have two seperate variables
                 * for the container and the image element. If we're not in altMode, the two variables
                 * are the same so the code below will work regardless of modes.
                 */
                if ($scope.altMode) {
                    elementCont = $element;
                    element = $element.find('div');
                } else {
                    elementCont = $element;
                    element = $element;
                }
                /**
                 * Observe the lazy-background attribute so that when it's set on a rendered element
                 * it can fetch the new image and fade to it
                 */
                $attrs.$observe('lazyBackground', function(newSrc) {
                    // Make sure newSrc is valid else return error
                    if (newSrc == null || newSrc == "") {
                        element.css('background-image', '');
                        elementCont.addClass('img-load-error');
                        return;
                    }

                    /**
                     * Removes any error class on the element and then adds the loading class to the element.
                     * This is required in cases where the element can load more than 1 image.
                     */
                    elementCont.removeClass('img-load-error');
                    elementCont.addClass('img-loading');

                    /**
                     * Use some oldskool preloading techniques to load the image
                     */
                    var img = $document[0].createElement('img');
                    img.onload = function() {
                        element.css('background-image', 'url("'+this.src+'")');
                        elementCont.removeClass('img-loading');
                    };
                    img.onerror = function() {
                        //Remove any existing background-image & loading class and apply error class
                        element.css('background-image', '');
                        elementCont.removeClass('img-loading');
                        elementCont.addClass('img-load-error');
                    };
                    img.src = encodeURI(newSrc);
                });
            }
        };
    }
]);
