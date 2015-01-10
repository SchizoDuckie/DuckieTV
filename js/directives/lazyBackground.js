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

            /** 
             * Observe the lazy-background attribute so that when it's set on a rendered element 
             * it can fetch the new image and fade to it 
             */ 
            attrs.$observe('lazyBackground', function(newSrc) {
              /**
                * Check if an image url is provided or valid
                * NOTE: I thought the serieHeader template prevented sending empty srcs however
                * in my tests numerous empty newSrcs are being sent?
                */
                if (newSrc == "" || newSrc == 'http://ir0.mobify.com/webp/' || newSrc == 'http://ir0.mobify.com/webp/250/') {
                    element.addClass('poster-load-error');
                    return;
                }

                element.removeClass('poster-load-error');
                element.addClass('poster-loading');

                /** 
                 * Use some oldskool preloading techniques to load the image
                 * and fade it in when done 
                 */
                var img = $document[0].createElement('img');
                img.onload = function() {
                    element.removeClass('poster-loading');
                    element.css('background-image', 'url(' + this.src + ')');
                };
                img.onerror = function(e) {
                    element.removeClass('poster-loading');
                    element.addClass('poster-load-error');
                    console.error("image load error!", e);
                };
                attrs.ngHide = false;
                img.src = newSrc;
            });

        }
    };
})