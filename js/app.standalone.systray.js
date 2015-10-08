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
        if (window.localStorage.getItem('standalone.minimizeSystray') !== 'N') {
            // Hide window
            win.hide();

            var menu =  new gui.Menu();

            // Show tray
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

            var exitClick = function() {
                this.remove();
                win.close(true);
            }.bind(tray);

            // If on a mac add a show DTV Menu Button
            if (navigator.platform.indexOf('Mac') > -1) {
                var clickie = new gui.MenuItem({ label: 'Show DuckieTV' });
                    clickie.on('click', trayClick);
                menu.append(clickie);
            }

            // Add an exit button
            var exitbtn = new gui.MenuItem({ label: 'Exit' });
                exitbtn.on('click', exitClick);
            menu.append(exitbtn);

            tray.tooltip = navigator.userAgent;
            tray.on('click', trayClick);
        }
    });

    // get the restore event
    win.on('restore', function() {
        if (window.localStorage.getItem('standalone.minimizeSystray') !== 'N') {
            tray.remove();
        }
    });

    // Only fires if force close is false
    /* Prototype
    win.on('close', function() {

        win.showDevTools();

        var queryStats = CRUD.stats;

        /**
         * When closing DuckieTV we don't currently check if there is any ongoing database operations
         * It is possible to check as CRUD is global and we can continue to run the db updates in background
         * until finished and then properly close the app.
         * One issue however is that CRUDs 'writesQueued' isn't the correct number, more db operations can
         * be added after it finishes which leaves like 1ms where 'Can close safely' function will fire incorrectly.
         *//*
        if (queryStats.writesExecuted < queryStats.writesQueued) {
            Object.observe(CRUD.stats, function() {
                queryStats = CRUD.stats;
                if (queryStats.writesExecuted < queryStats.writesQueued) {
                    console.log("Database operations still ongoing!");
                } else {
                    console.log("Can close safely, win.close(true) in console to close");
                }
            });
        } else {
            console.log("We can close safely, win.close(true) in console to close");
        }
    }); */
}
