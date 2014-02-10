/**
 * SchizoDuckie 2014
 * Lazy load background module.
 * Fades in the element that you set the lazy-background property to after the image has been loaded and
 * set as css background image.
 */
(function() {
    'use strict';

    angular.module('lazy-background', []).
    directive('lazyBackground', ['$document', '$parse', function($document, $parse) {
        return {
            restrict: 'A',
            link: function($scope, iElement, iAttrs) {
                iElement = angular.element(iElement);
                var src = iAttrs.lazyBackground;
                iElement.css({ 'transition' : 'opacity 0.5s ease-in', 'opacity':0});
                var img = $document[0].createElement('img');
                img.onload = function() {
                     iElement.css({
                        'background-image': 'url(' + this.src + ')',
                        'opacity':'1'
                    });
                };
                img.onerror= function() {
                   iElement.css({
                        'opacity':'1'
                    });
                };
                img.src = src;
            
            }
        };
    }]);
})();