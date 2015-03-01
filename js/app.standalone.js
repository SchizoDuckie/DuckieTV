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
}