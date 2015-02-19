/**
 * SchizoDuckie 2014
 * Lazy load background module.
 * Fades in the element that you set the lazy-background property to after the image has been loaded and
 * set as css background image.
 */
angular.module('DuckieTV.directives.lazybackground', [])

.directive('lazyBackground', ["$document", "$parse", function($document, $parse) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            element = angular.element(element);
            attrs.ngHide = true;

            /** 
             * Observe the lazy-background attribute so that when it's set on a rendered element 
             * it can fetch the new image and fade to it 
             */ 
            attrs.$observe('lazyBackground', function(newSrc) {
                // Make sure newSrc is valid else return error
                if (newSrc == null || newSrc == "") {
                    element.addClass('img-load-error');
                    return;
                }

                /**
                 * Removes any error class on the element and then adds the loading class to the element.
                 * This is required in cases where the element can load more than 1 image.
                 */
                element.removeClass('img-load-error');
                element.addClass('img-loading');

                /** 
                 * Use some oldskool preloading techniques to load the image
                 * and fade it in when done
                 * ToDo: Maybe change to a promise system so we can stop loading an image and have a timeout
                 */
                var img = $document[0].createElement('img');
                img.onload = function() {
                    element.removeClass('img-loading');
                    element.css('background-image', 'url(' + this.src + ')');
                };
                img.onerror = function(e) {
                    //Remove loading class and apply error class
                    element.removeClass('img-loading');
                    element.addClass('img-load-error');
                };
                attrs.ngHide = false;
                img.src = newSrc;
            });
        }
    };
}])
