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
    var moveTimeout;   // timer used by win.on(move)
    var resizeTimeout;  // timer used by won.on(resize)
    var isStartupMinimized = SettingsService.get('standalone.startupMinimized');

    // managing Integers in local Storage
    localStorageSetInt = function (key, value) {
        localStorage.setItem(key, value);
    };

    // managing Integers in local Storage
    localStorageGetInt = function (key, defaultValue) {
        var intValue = !localStorage.getItem(key) ? defaultValue : parseInt(localStorage.getItem(key), 10);
        if (isNaN(intValue)) {
            intValue = defaultValue;
        };
        return intValue;
    };

    // return the current window state versus requested: true / false
    isWinState = function (winState) {
        var winStateValue = localStorage.getItem('standalone.winState') || 'Normal';
        return winStateValue === winState;
    };

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
        var zoomIndex = localStorageGetInt('standalone.zoomlevel', 6);
        // if due to prior commits the level is now invalid then reset.
        if (zoomIndex < 0 || zoomIndex > 15) {
            zoomIndex = 6;
            localStorageSetInt('standalone.zoomlevel', zoomIndex);
            console.info('standalone.zoomlevel reset to 6');
        };
        win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);

        // Get the minimize event
        win.on('minimize', function() {
            console.debug('Minimized');
            // Hide window
            var winState = localStorage.getItem('standalone.winState') || 'Normal';
            localStorage.setItem('standalone.prevWinState', winState);
            localStorage.setItem('standalone.winState', 'Minimized');
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
                win.emit('restore');
            });
        });

        // get the restore (un-minimize) screen event
        win.on('restore', function() {
            console.debug('Restored');
            var prevWinState = localStorage.getItem('standalone.prevWinState') || 'Normal';
            localStorage.setItem('standalone.winState', prevWinState);
        });

        // get the maximize screen event
        win.on('maximize', function() {
            console.debug('Maximized');
            localStorage.setItem('standalone.winState', 'Maximized');
        });

        // get the un-maximize screen event
        win.on('unmaximize', function() {
            console.debug('Unmaximized');
            localStorage.setItem('standalone.winState', 'Normal');
        });

        // get the zoom command events
        window.addEventListener('keydown', function(event) {

            switch (event.keyCode) {
                case 123: // F12, show inspector
                    win.showDevTools();
                    break;
                case 187: // +
                    if (event.ctrlKey == true) {
                        zoomIndex = (zoomIndex >= 0 && zoomIndex < 15) ? zoomIndex + 1 : zoomIndex;
                        win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);
                        localStorageSetInt('standalone.zoomlevel', zoomIndex);
                    }
                    break;
                case 189: // -
                    if (event.ctrlKey == true) {
                        zoomIndex = (zoomIndex > 0 && zoomIndex <= 15) ? zoomIndex - 1 : zoomIndex;
                        win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);
                        localStorageSetInt('standalone.zoomlevel', zoomIndex);
                    }
                    break;
                case 48: // 0
                    if (event.ctrlKey == true) {
                        zoomIndex = 6;
                        win.zoomLevel = Math.log(zoom[zoomIndex] / 100) / Math.log(1.2);
                        localStorageSetInt('standalone.zoomlevel', zoomIndex);
                    }
            }
        });

        // get the move screen event
        win.on('move', function(x,y) {
            // move event may occur multiple times during transition, so wait a bit to try catch the last one
             if (isWinState('Normal'))  {
                clearTimeout(moveTimeout);
                moveTimeout = setTimeout( function () {
                    console.debug('moved to', x, y);
                    localStorageSetInt('standalone.x', x);
                    localStorageSetInt('standalone.y', y);
                }, 500);
            }
        });

        // get the resize screen event
         win.on('resize', function(width,height) {
            // resize event may occur multiple times during transition, so wait a bit to try catch the last one
             if (isWinState('Normal'))  {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout( function () {
                    console.debug('resized to', width, height);
                    localStorageSetInt('standalone.width', width);
                    localStorageSetInt('standalone.height', height);
                }, 500);
             }
        });

        // go maximized at start up ?
        if (isWinState('Maximized')) {
            win.maximize();
        };

        // go Normal at start up ? (move and resize to last saved)
        if (isWinState('Normal')) {
            /*
             * set up default windows size for first time users
             * centred, 3/4 of available dimensions, more or less
             * the min and max values are taken from package.json
             */
            var width = 600; // minimum
            var height = 400; // minimum
            if (window.screen.availWidth > width) {
                width = Math.floor(window.screen.availWidth * 0.75);
                width = (width > 1000) ? 1000 : width; // maximum
            };
            if (window.screen.availWidth > width) {
                height = Math.floor(window.screen.availHeight * 0.75);
                height = (height > 750) ? 750 : height; // maximum
            };
            var x = Math.floor((window.screen.availWidth - width) / 2);
            var y = Math.floor((window.screen.availHeight - height) / 2);
            // resize and move to last saved
            win.resizeTo(localStorageGetInt('standalone.width', width), localStorageGetInt('standalone.height', height));
            win.moveTo(localStorageGetInt('standalone.x', x), localStorageGetInt('standalone.y', y));
        };

        // go minimized at start up ? (as long as there is not updateDialog pending)
        if (isStartupMinimized && !updateDialog) {
            win.minimize();
        };
    }
})

/*
 * Standalone Controller
 */
.controller('StandaloneCtrl', ['$scope',
    function($scope) {
        if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {

            var winState =  localStorage.getItem('standalone.winState') || 'Normal';
            $scope.maxButton = (winState === 'Normal') ? true : false;

            var win = require('nw.gui').Window.get();

            this.close = function() {
                win.close();
            };
            this.minimize = function() {
                win.minimize();
            };
            this.maximize = function() {
                $scope.maxButton = false;
                win.maximize();
            };
            this.unmaximize = function() {
                $scope.maxButton = true;
                win.unmaximize();
            };
        }
    }
])