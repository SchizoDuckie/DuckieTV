/**
 * SchizoDuckie 2014
 * Lazy load background module.
 * Fades in the element that you set the lazy-background property to after the image has been loaded and
 * set as css background image.
 */
angular.module('DuckieTV.directives.lazybackground', [])

.directive('lazyBackground', function($document, $parse) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            element = angular.element(element);
            attrs.ngHide = true;
            var isLoading = false;

            /** 
             * Observe the lazy-background attribute so that when it's set on a rendered element 
             * it can fetch the new image and fade to it 
             */ 
            attrs.$observe('lazyBackground', function(newSrc) {
                if (newSrc == "" || newSrc == 'http://ir0.mobify.com/webp/' || newSrc == 'http://ir0.mobify.com/webp/250/') return;
                //If an element already has the loading style applied, don't update the styles
                if(!isLoading) {
                    element.attr('oldStyle', element.attr('style') == null ? '' : element.attr('style'));
                    element.css('transition', 'opacity 0.5s ease-in');
                    element.css('opacity', 0.5);
                    element.css('background-image', 'url(img/spinner.gif)');
                    element.css('background-position', 'center center');
                    element.attr('style', element.attr('style') + '; background-size: initial !important');
                };

                /** 
                 * Use some oldskool preloading techniques to load the image
                 * and fade it in when done 
                 */
                isLoading = true;
                var img = $document[0].createElement('img');
                img.onload = function() {
                    element.attr('style', element.attr('oldStyle'));
                    element.css('background-image', 'url(' + this.src + ')');
                    isLoading = false;
                };
                img.onerror = function(e) {
                    console.log("image load error!", e);
                    isLoading = false;
                    element.css({
                        'opacity': '1'
                    });
                };
                attrs.ngHide = false;
                img.src = newSrc;
            });

        }
    };
})