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
        // should we minimize to systray or taskbar?
        if (window.localStorage.getItem('standalone.minimizeSystray') === 'Y') {
            // Hide window
            win.hide();

            // Show tray
            var menu =  new gui.Menu();
            tray = new gui.Tray({
                title: navigator.userAgent,
                icon: 'img/logo/icon64.png',
                menu: menu
            });
            var trayClick = function() {
                this.remove();
                win.show();
                win.emit('restore');
            }.bind(tray);

          if(navigator.platform.indexOf('Mac') > -1) {
            var clickie = new gui.MenuItem({ label: 'Show DuckieTV' });
                clickie.on('click', trayClick);
            menu.append(clickie);
            };

            tray.tooltip = navigator.userAgent;
            tray.on('click', trayClick);
        }
    });

    // get the restore event
    win.on('restore', function() {
        if (window.localStorage.getItem('standalone.minimizeSystray') === 'Y') {
            tray.remove();
        }
    });
}
