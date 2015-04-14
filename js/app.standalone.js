// system tray settings for Standalone
DuckieTV
.run(function(SettingsService) {
    if (navigator.userAgent.toUpperCase().indexOf('STANDALONE') != -1) {

        document.body.classList.add('standalone');
        // Load library
        var gui = require('nw.gui');

        // Reference to window and tray
        var win = gui.Window.get();
        var tray;
        win.zoomLevel = SettingsService.get('standalone.zoomlevel');

        // Get the minimize event
        win.on('minimize', function() {
            // Hide window
            this.hide();

            // Show tray
            tray = new gui.Tray({
                icon: 'img/icon64.png'
            });

            // Show window and remove tray when clicked
            tray.on('click', function() {
                win.show();
                this.remove();
                tray = null;
            });
        });

        window.addEventListener('keydown', function(event) {
            var level = [0,0.08,0.17,0.17,0.08,0.15,0.1,0.1,0.15,0.25,0.25,0.25,0.5,0.5,1,1,0];
            var zoom = [25,33,50,67,75,90,100,110,125,150,175,200,250,300,400,500];
            var zoomLevel = 0;
            
            switch (event.keyCode) {
                case 123: // F12, show inspector
                    win.showDevTools();
                    break;
                case 187: // +
                    if (event.ctrlKey == true) {
                        zoomLevel = Math.round(win.zoomLevel * 100);
                        win.zoomLevel = (zoomLevel >= 25 && zoomLevel < 500) ? win.zoomLevel + level[zoom.indexOf(zoomLevel)+1] : win.zoomLevel;
                        SettingsService.set('standalone.zoomlevel', win.zoomLevel);
                    }
                    break;
                case 189: // -
                    if (event.ctrlKey == true) {
                        zoomLevel = Math.round(win.zoomLevel * 100);
                        win.zoomLevel = (zoomLevel > 25 && zoomLevel <= 500) ? win.zoomLevel - level[zoom.indexOf(zoomLevel)]  : win.zoomLevel;
                        SettingsService.set('standalone.zoomlevel', win.zoomLevel);
                    }
                    break;
                case 48: // 0
                    if (event.ctrlKey == true) {
                        win.zoomLevel = 1;
                        SettingsService.set('standalone.zoomlevel', win.zoomLevel);
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
                                window.open(element[0].getAttribute('href'), '_blank');
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