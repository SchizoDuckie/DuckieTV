// system tray settings for Standalone
if (navigator.userAgent.toUpperCase().indexOf('STANDALONE') != -1) {
    // Load library
    var gui = require('nw.gui');

    // Reference to window and tray
    var win = gui.Window.get();
    var tray;

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
        switch (event.keyCode) {
            case 123: // F12, show inspector
                win.showDevTools();
                break;
            case 187: // +
                if (event.ctrlKey == true) {
                    win.zoomLevel = win.zoomLevel + 0.25;
                }
                break;
            case 189: // -
                if (event.ctrlKey == true) {
                    win.zoomLevel = win.zoomLevel - 0.25;
                }
                break;
            case 48: // 0
                if (event.ctrlKey == true) {
                    win.zoomLevel = 1;
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