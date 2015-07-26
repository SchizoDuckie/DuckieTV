// system tray settings for Standalone
DuckieTV
    .directive('target', function() {
        return {
            restrict: 'A',
            scope: '=',
            link: function($scope, element) {
                if (navigator.userAgent.toLowerCase().indexOf('standalone') === -1) return;
                if (element[0].getAttribute('target')) {
                    if (element[0].getAttribute('target').toLowerCase() == '_blank') {
                        element[0].addEventListener('click', function(e) {
                            e.stopPropagation();
                            e.preventDefault();
                            require('nw.gui').Shell.openExternal(element[0].getAttribute('href'));
                            return false;
                        })
                    }
                }
            }
        };
    })
    .run(function(SettingsService, $http, dialogs) {
        var updateDialog = false;
        var moveTimeout;
        var resizeTimeout;
        if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {
            // check last updated every 2 days.
            var lastUpdateCheck = localStorage.getItem('github.lastupdatecheck');
            if (!lastUpdateCheck || lastUpdateCheck + (60 * 60 * 24 * 2 * 1000) < new Date().getTime()) {
                $http.get('https://api.github.com/repos/SchizoDuckie/DuckieTV/releases').then(function(result) {
                    var result = result.data;
                    // store current update time.
                    localStorage.setItem('github.lastupdatecheck', new Date().getTime());
                    // if release is older than current version, skip.
                    if (parseFloat(result[0].tag_name) <= parseFloat(navigator.userAgent.replace('DuckieTV Standalone v', ''))) {
                        return;
                    }
                    // if release was dismissed, skip.
                    var settingsKey = 'notification.dontshow.' + result[0].tag_name;
                    if (!localStorage.getItem(settingsKey)) {
                        return;
                    }
                    updateDialog = true;
                    var releasenotes = '\n' + result[0].body;
                    var dlg = dialogs.confirm('New DuckieTV release!', [
                        'A new version of DuckieTV is available (v', result[0].tag_name, ', released ', new Date(result[0].published_at).toLocaleDateString(), ')<br>',
                        '<p style="margin: 20px 0px; white-space: pre; overflow-wrap: break-word; background-color: transparent; color:white;">',
                        releasenotes.replace(/\n- /g, '<li>'),
                        '</p>',
                        'Do you wish to download it now?',
                        '<br><label class="btn btn-danger" onclick="localStorage.setItem(\'', settingsKey, '\', 1);"> Don\'t show this notification again for v', result[0].tag_name, '</button>'
                    ].join(''));

                    dlg.result.then(function(btn) {
                        require('nw.gui').Shell.openExternal(result[0].html_url);
                    });
                })
            }

            var zoom = [25, 33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500];

            document.body.classList.add('standalone');
            // Load library
            var gui = require('nw.gui');

            // Reference to window and tray
            var win = gui.Window.get();
            var tray;
            var zoomIndex = parseInt(SettingsService.get('standalone.zoomlevel'));
            // if due to prior commits the level is now invalid then reset.
            if (zoomIndex < 0 || zoomIndex > 15) {
                zoomIndex = 6;
                SettingsService.set('standalone.zoomlevel', zoomIndex);
                console.info('standalone.zoomlevel reset to 6');
            };
            win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);

            // Get the minimize event
            win.on('minimize', function() {
                // Hide window
                this.hide();

                // Show tray
                var tray = new gui.Tray({
                    title: navigator.userAgent,
                    icon: 'img/icon64.png',
                    menu: new gui.Menu()
                });
                tray.tooltip = navigator.userAgent;
                tray.on('click', function() {
                    win.show();
                    this.remove();
                    tray = null;
                });
            });

            window.addEventListener('keydown', function(event) {

                switch (event.keyCode) {
                    case 123: // F12, show inspector
                        win.showDevTools();
                        break;
                    case 187: // +
                        if (event.ctrlKey == true) {
                            zoomIndex = (zoomIndex >= 0 && zoomIndex < 15) ? zoomIndex + 1 : zoomIndex;
                            win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);
                            SettingsService.set('standalone.zoomlevel', zoomIndex);
                        }
                        break;
                    case 189: // -
                        if (event.ctrlKey == true) {
                            zoomIndex = (zoomIndex > 0 && zoomIndex <= 15) ? zoomIndex - 1 : zoomIndex;
                            win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);
                            SettingsService.set('standalone.zoomlevel', zoomIndex);
                        }
                        break;
                    case 48: // 0
                        if (event.ctrlKey == true) {
                            zoomIndex = 6;
                            win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);
                            SettingsService.set('standalone.zoomlevel', zoomIndex);
                        }
                }
            });

            window.addEventListener('move', function() {
                /* move event may occur multiple times during transition, so wait a bit to try catch the last one
                 * https://github.com/nwjs/nw.js/wiki/Window states the callback is called with two arguments: x and y for the new location of the upper-left corner of the window; but reality differs
                 */
                clearTimeout(moveTimeout);
                moveTimeout = setTimeout(function () {
                    SettingsService.set('standalone.x', win.x);
                    SettingsService.set('standalone.y', win.y);
                    console.debug('moved to',win.x,win.y);
                }, 500);
            });
            
             window.addEventListener('resize',  function() {
                /* resize event may occur multiple times during transition, so wait a bit to try catch the last one
                 * https://github.com/nwjs/nw.js/wiki/Window states the callback is called with two arguments: width and height for the new size of the window; but reality differs
                 */
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(function () {
                    SettingsService.set('standalone.width', win.width);
                    SettingsService.set('standalone.height', win.height);
                    console.debug('resized to',win.width,win.height);
                }, 500);
            });

            if (SettingsService.get('standalone.winState') === 'Maximized') {
                win.maximize();
            };

            if (SettingsService.get('standalone.width') !== -1) {
                win.resizeTo(SettingsService.get('standalone.width'),SettingsService.get('standalone.height'));
            };

            if (SettingsService.get('standalone.x') !== -1) {
                win.moveTo(SettingsService.get('standalone.x'),SettingsService.get('standalone.y'));
            };

            if (SettingsService.get('standalone.startupMinimized') && !updateDialog) {
                win.minimize();
            };
        }
    })

/*
 * Standalone Controller
 */
.controller('StandaloneCtrl', ['$scope', 'SettingsService',
    function($scope, SettingsService) {
        if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {

            $scope.winState = SettingsService.get('standalone.winState');

            var win = require('nw.gui').Window.get();

            this.close = function() {
                win.close();
            };
            this.minimize = function() {
                win.minimize();
            };
            this.maximize = function() {
                $scope.winState = 'Maximized';
                SettingsService.set('standalone.winState', $scope.winState);
                win.maximize();
            };
            this.unmaximize = function() {
                $scope.winState = 'Normal';
                SettingsService.set('standalone.winState', $scope.winState);
                win.unmaximize();
            };
        }
    }
])