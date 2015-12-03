/**
 * nw.js standalone systray mac hack
 */
if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) && (navigator.platform.toLowerCase().indexOf('mac') !== -1)) {
    console.log("Mac Detected");
    var gui = require('nw.gui');
    // Reference to window and tray
    var win = gui.Window.get();
    var tray;

    // Get the minimize event
    win.on('minimize', function() {
        // should we minimize to systray or taskbar?
        if (window.localStorage.getItem('standalone.minimizeSystray') !== 'N') {
            // Hide window
            win.hide();

            // create empty menu
            var menu = new gui.Menu();

            // Show tray
            tray = new gui.Tray({
                title: navigator.userAgent,
                icon: 'img/logo/icon64.png',
                menu: menu
            });
            // fix for issue https://github.com/nwjs/nw.js/issues/1903
            tray.tooltip = navigator.userAgent;

            // handle tray click
            var trayClick = function() {
                this.remove();
                win.show();
                win.emit('restore');
            }.bind(tray);
            tray.on('click', trayClick);

            // handle exit menu click
            var exitClick = function() {
                this.remove();
                win.close(true);
            }.bind(tray);

            // handle calendar menu click
            var calendarClick = function() {
                win.emit('standalone.calendar');
                trayClick();
            };

            // handle favorites menu click
            var favoritesClick = function() {
                win.emit('standalone.favorites');
                trayClick();
            };

            // handle settings menu click
            var settingsClick = function() {
                win.emit('standalone.settings');
                trayClick();
            };

            // handle about menu click
            var aboutClick = function() {
                win.emit('standalone.about');
                trayClick();
            };

            // add show menu
            var menuShow = new gui.MenuItem({
                label: 'Show DuckieTV'
            });
            menuShow.on('click', trayClick);
            menu.append(menuShow);

            // add calendar menu
            var menuCalendar = new gui.MenuItem({
                label: 'Show Calendar'
            });
            menuCalendar.on('click', calendarClick);
            menu.append(menuCalendar);

            // add favorites menu
            var menuFavorites = new gui.MenuItem({
                label: 'Show Favorites'
            });
            menuFavorites.on('click', favoritesClick);
            menu.append(menuFavorites);

            // add settings menu
            var menuSettings = new gui.MenuItem({
                label: 'Show Settings'
            });
            menuSettings.on('click', settingsClick);
            menu.append(menuSettings);

            // add about menu
            var menuAbout = new gui.MenuItem({
                label: 'Show About'
            });
            menuAbout.on('click', aboutClick);
            menu.append(menuAbout);

            // add a separator to menu
            menu.append(new gui.MenuItem({
                type: 'separator'
            }));

            // Add an exit menu
            var menuExit = new gui.MenuItem({
                label: 'Exit',
                modifiers: 'cmd-Q',
                key: 'q'
            });

            menuExit.on('click', exitClick);
            menu.append(menuExit);

        }
    });

    // get the restore event
    win.on('restore', function() {
        if (window.localStorage.getItem('standalone.minimizeSystray') !== 'N') {
            tray.remove();
        }
    });
}