/**
 * A <background-rotator channel="'event:channel'"> directive.
 * Usage:
 * Put <background-rotator tag anywhere with a channel parameter
 * directive waits until a new event has been broadcasted with the full url to an image
 * preloads new image
 * Cross-fades between current loaded image and the new image
 */
DuckieTV.directive('backgroundRotator', ["$rootScope", "$document",
    function($rootScope, $document) {
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
                        $scope.$applyAsync();
                    };
                    img.src = url;
                };

                $rootScope.$on($scope.channel, function(event, url) {
                    load(url);
                });
            }
        };
    }
])

.directive("kc", ["$document", "SettingsService",
    function(bork, blaarp) {
        return {
            link: function(scope) {
                var _0x7492 = ["\x6B\x63", "\x61\x64\x64", "\x63\x6C\x61\x73\x73\x4C\x69\x73\x74", "\x62\x6F\x64\x79", "\x6B\x65\x79\x43\x6F\x64\x65", "\x6C\x65\x6E\x67\x74\x68", "\x6B\x65\x79\x64\x6F\x77\x6E", "\x6F\x6E", "\x6B\x63\x2E\x61\x6C\x77\x61\x79\x73", "\x67\x65\x74"];
                var kk = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65],
                    k = 0,
                    ___ = function() {
                        document[_0x7492[3]][_0x7492[2]][_0x7492[1]](_0x7492[0]);
                    },
                    ____ = function(_0x209ax5) {
                        if (_0x209ax5[_0x7492[4]] === kk[k++]) {
                            if (k === kk[_0x7492[5]]) {
                                ___();
                            }
                        } else {
                            k = 0;
                        }
                    };
                bork[_0x7492[7]](_0x7492[6], ____);
                if (blaarp[_0x7492[9]](_0x7492[8])) {
                    ___();
                }
            }
        };
    }
]);