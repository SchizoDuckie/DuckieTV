// system tray settings for Standalone
DuckieTV
    .run(function(SettingsService) {
        if (navigator.userAgent.toUpperCase().indexOf('STANDALONE') != -1) {

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

            DuckieTV.directive('target', function() {
                return {
                    restrict: 'A',
                    scope: '=',
                    link: function($scope, element) {
                        if (element[0].getAttribute('target')) {
                            if (element[0].getAttribute('target').toLowerCase() == '_blank') {
                                element[0].onclick = function(e) {
                                    win.open(element[0].getAttribute('href'), {
                                        focus: true
                                    });
                                    return false;
                                }
                            }
                        }
                    }
                };
            });
        }
    })

/*
 * Standalone Controller
 */
.controller('StandaloneCtrl', ["$scope",
    function($scope) {
        if (navigator.userAgent.toUpperCase().indexOf('STANDALONE') != -1) {

            $scope.winState = "Normal";

            var win = require('nw.gui').Window.get();

            this.close = function() {
                win.close();
            };
            this.minimize = function() {
                $scope.winState = "Normal"
                win.minimize();
            };
            this.maximize = function() {
                $scope.winState = "Maximized";
                win.maximize();
            };
            this.unmaximize = function() {
                $scope.winState = "Normal"
                win.unmaximize();
            };
        }
    }
])