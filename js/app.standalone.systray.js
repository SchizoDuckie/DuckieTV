/**
 * nw.js standalone systray
 */
if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {

    var gui = require('nw.gui');
    // Reference to window and tray
    var win = gui.Window.get();
    var tray;

    // Get the minimize event
    win.on('minimize', function() {
        // Hide window
        win.hide();

        // Show tray
        tray = new gui.Tray({
            title: navigator.userAgent,
            icon: 'img/icon64.png',
            menu: new gui.Menu()
        });
        tray.tooltip = navigator.userAgent;
        tray.on('click', function() {
            win.show();
            tray.remove();
            tray = null;
            win.emit('restore');
        });

    });
}