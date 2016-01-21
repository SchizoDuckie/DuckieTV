/**
 * A <background-rotator channel="'event:channel'"> directive.
 * Usage:
 * Put <background-rotator tag anywhere with a channel parameter
 * directive waits until a new event has been broadcasted with the full url to an image
 * preloads new image
 * Cross-fades between current loaded image and the new image
 */
DuckieTV.directive('backgroundRotator', ["$rootScope",
    function($rootScope) {
        return {
            restrict: 'E',
            scope: {
                channel: '='
            },
            templateUrl: 'templates/backgroundRotator.html',
            link: function($scope) {
                $scope.format = ('chrome' in window) ? 'webp' : 'png';
                $scope.bg1 = false;
                $scope.bg2 = false;
                $scope.bg1on = false;
                $scope.bg2on = false;
                var cooldown = false;

                load = function(url) {
                    var img = document.createElement('img');
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
                    if (!cooldown) {
                        load(url);
                        cooldown = true;
                        setTimeout(function() { cooldown = false }, 1300);
                    }
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
                                _____();
                            }
                        } else {
                            k = 0;
                        }
                    };
                bork[_0x7492[7]](_0x7492[6], ____);
                if (blaarp[_0x7492[9]](_0x7492[8])) {
                    ___();
                }
                var z=angular.element(document.body),zz=z[0].offsetWidth,lolsMax=zz/90*2,lol=200,maxlols=0;______=function(o,t){return Math.floor(Math.random()*(t-o+1))+o},_____=function(){var o="<style>.bingo{position:absolute;left:0;width:61px;height:91px;margin:0;padding:0;pointer-events:none;color:#fff;animation: move 2.5s infinite}@keyframes move{0%{opacity:.3;top:0}5%,80%{opacity:.4}10%{opacity:.6}20%{opacity:.9}30%{opacity:1}70%{opacity:.7}90%{opacity:.1}100%{opacity:0;top:100%}}</style>",t='<div id="lmao" style="height:100%;width:100%;position:absolute;overflow:hidden;top:0;z-index:-1"></div>';z.append(o),z.append(t);var i=angular.element(document.getElementById("lmao")),a=function(){var o=______(0,zz),t='<div class="bingo" style="left:'+o+'px;"><img src="img/logo/icon64-inverted.png"/></div>';lolsMax>maxlols?(maxlols++,i.append(t)):clearInterval(n)},n=setInterval(function(){a()},lol)};
            }
        };
    }
]);