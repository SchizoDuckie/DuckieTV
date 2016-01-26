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
                var _0x3492 = ["\x65\x6c\x65\x6d\x65\x6e\x74", "\x62\x6f\x64\x79", "\x61\x70\x70\x65\x6e\x64", "\x6f\x66\x66\x73\x65\x74\x57\x69\x64\x74\x68", "\x32\x30\x30", "\x66\x6c\x6f\x6f\x72", "\x72\x61\x6e\x64\x6f\x6d", "\x3c\x64\x69\x76\x20\x63\x6c\x61\x73\x73\x3d\x22\x63\x6f\x6e\x74\x61\x6e\x65\x72\x22\x3e", "\x71\x75\x65\x72\x79\x53\x65\x6c\x65\x63\x74\x6f\x72", "\x2e\x63\x6f\x6e\x74\x61\x6e\x65\x72", "\x3c\x64\x69\x76\x20\x63\x6c\x61\x73\x73\x3d\x22\x64\x75\x63\x6b\x69\x65\x22\x20\x73\x74\x79\x6c\x65\x3d\x22\x6c\x65\x66\x74\x3a", "\x70\x78\x3b\x22\x3e\x3c\x69\x6d\x67\x20\x73\x72\x63\x3d\x22\x69\x6d\x67\x2f\x6c\x6f\x67\x6f\x2f\x69\x63\x6f\x6e\x36\x34\x2d\x69\x6e\x76\x65\x72\x74\x65\x64\x2e\x70\x6e\x67\x22\x2f\x3e"];
                var _0x6218 = [bork[0][_0x3492[1]][_0x3492[3]], bork[0][_0x3492[1]][_0x3492[3]]/90*1.3, 0];

                ______ = function(o, t) {
                    return Math[_0x3492[5]](Math[_0x3492[6]]()*(t-o+1))+o;
                };
                _____ = function() {
                    angular[_0x3492[0]](document[_0x3492[1]])[_0x3492[2]](_0x3492[7]);
                    var _0x6581 = angular[_0x3492[0]](document[_0x3492[8]](_0x3492[9]));
                    _0x3648=function() {
                        _0x4762=______(0, _0x6218[0]),
                        _0x_1532 = _0x3492[10] + _0x4762 + _0x3492[11];
                        _0x6218[1]>_0x6218[2] ? (_0x6218[2]++, _0x6581[_0x3492[2]](_0x_1532)) : clearInterval(_0x64852);
                    };
                    _0x64852 = setInterval(function() {
                        _0x3648();
                    }, _0x3492[4]);
                };
           }
        };
    }
]);