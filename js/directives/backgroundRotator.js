angular.module('DuckieTV.directives.backgroundrotator', [])

/**
 * A <background-rotator channel="'event:channel'"> directive.
 * Usage:
 * Put <background-rotator tag anywhere with a channel parameter
 * directive waits until a new event has been broadcasted with the full url to an image
 * preloads new image
 * Cross-fades between current loaded image and the new image
 */
.directive('backgroundRotator', function($rootScope, $document) {
    return {
        restrict: 'E',
        scope: {
            channel: '='
        },

        template: ["<div style='z-index:-2; background-image:url(img/duckietv.png);background-color:darkgrey;background-size:initial;'></div><div ng-style=\"{backgroundImage: bg1 ? 'url('+bg1+')': '',  'transition' : 'opacity 1s ease-in-out', opacity: bg1on ? 1 : 0}\"></div>",
            "<div ng-style=\"{backgroundImage: bg2 ? 'url('+bg2+')': '',  'transition' : 'opacity 1s ease-in-out', opacity: bg2on ? 1 : 0}\"></div>"
        ].join(''),
        link: function($scope, $attr) {
            $scope.format = ('chrome' in window) ? 'webp' : 'png';
            $scope.bg1 = false;
            $scope.bg2 = false;
            $scope.bg1on = false;
            $scope.bg2on = false;

            load = function(url) {
                var img = $document[0].createElement('img');
                img.onload = function() {
                    var target = $scope.bg1on ? 'bg2' : 'bg1';
                    $scope[target] = img.src;
                    $scope[target + 'on'] = true;
                    $scope[(target == 'bg1' ? 'bg2on' : 'bg1on')] = false;
                    $scope.$digest();
                };
                img.onerror = function(e) {
                    console.error("image load error!", e, url);
                };
                img.src = url;
            };

            $rootScope.$on($scope.channel, function(event, url) {
            	load(url);
            });
        }
    };
})
.directive("kc",function($document){return{link:function(scope){var kk=[38,38,40,40,37,39,37,39,66,65],k=0;var handler=function(e){if(e.keyCode===kk[k++]){if(k===kk.length){document.getElementById('wl').style.display=''}}else{k=0}};$document.on('keydown',handler)}}});