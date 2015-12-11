/**
 * nw.js standalone systray
 */
if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1)) {
    var tray = null,
        show, calendar, favorites, settings, about, exit;
    var alwaysShowTray = false;
    var gui = require('nw.gui');
    var win = gui.Window.get();
    
    // debugging
    console.debug('debugging source version=1');
    console.debug('standalone.alwaysShowTray='+window.localStorage.getItem('standalone.alwaysShowTray'));
    console.debug('standalone.startupMinimized='+window.localStorage.getItem('standalone.startupMinimized'));
    console.debug('minimizeSystray='+window.localStorage.getItem('standalone.minimizeSystray'));
    console.debug('closeSystray='+window.localStorage.getItem('standalone.closeSystray'));

    // Remakes/Creates the tray as once a tray is removed it needs to be remade.
    var createTray = function() {
        if (tray !== null) {
            tray.remove();
            tray = null;
            console.debug('createTray: tray removed');
        }
        tray = new gui.Tray({
            title: navigator.userAgent,
            icon: 'img/logo/icon64.png'
        });
        tray.on('click', function() {
            win.emit('standalone.calendar');
            win.show();
            win.emit('restore');
        });

        tray.tooltip = navigator.userAgent;

        var menu = new gui.Menu();
        // Create the menu, only needs to be made once
        // Add a show button
        show = new gui.MenuItem({
            label: "Show DuckieTV",
            click: function() {
                win.show();
                win.emit('restore');
            }
        });
        menu.append(show);

        // Add a calendar button
        calendar = new gui.MenuItem({
            label: "Show Calendar",
            click: function() {
                win.emit('standalone.calendar');
                win.show();
                win.emit('restore');
            }
        });
        menu.append(calendar);

        // Add a favorites button
        favorites = new gui.MenuItem({
            label: "Show Favorites",
            click: function() {
                win.emit('standalone.favorites');
                win.show();
                win.emit('restore');
            }
        });
        menu.append(favorites);

        // Add a settings button
        settings = new gui.MenuItem({
            label: "Show Settings",
            click: function() {
                win.emit('standalone.settings');
                win.show();
                win.emit('restore');
            }
        });
        menu.append(settings);

        // Add a about button
        about = new gui.MenuItem({
            label: "Show About",
            click: function() {
                win.emit('standalone.about');
                win.show();
                win.emit('restore');
            }
        });
        menu.append(about);

        // Add a separator
        menu.append(new gui.MenuItem({
            type: 'separator'
        }));

        // Add a exit button
        exit = new gui.MenuItem({
            label: "Exit",
            click: function() {
                win.close(true);
            },
            modifiers: 'cmd-Q',
            key: 'q'
        });
        menu.append(exit);

        tray.menu = menu;

        // Show DuckieTV on Click
        //tray.on('click', function() {
        //    win.show();
        //    win.emit('restore');
        //});
        console.debug('createTray: tray created');
    };

    // If we're always showing the tray, create it now (default is N or null)
    if (window.localStorage.getItem('standalone.alwaysShowTray') === 'Y') {
        console.debug('alwaysShowTray');
        alwaysShowTray = true;
        createTray();
    }
    // should we minimize after start-up? (default is N or null)
    if (localStorage.getItem('standalone.startupMinimized') === 'Y') {
        console.debug('startupMinimized');
        createTray();
    }

    // On Minimize Event
    win.on('minimize', function() {
        // Should we minimize to systray or taskbar? (default is N or null)
        console.debug('on minimize');
        if (window.localStorage.getItem('standalone.minimizeSystray') === 'Y') {
            console.debug('minimizeSystray');
            // Hide window
            win.hide();
            // Create a new tray if one isn't already
            if (!alwaysShowTray) {
                createTray();
            }
        }
    });

    // On Restore Event
    win.on('restore', function() {
        console.debug('on restore');
        // If we're not always showing tray, remove it
        if (tray && !alwaysShowTray) {
            console.debug('on restore: tray.remove');
            tray.remove();
        }
    });

    // On Close Event, fired before anything happens
    win.on('close', function() {
        // does close mean go to systray? (default N or null)
        if (window.localStorage.getItem('standalone.closeSystray') === 'Y') {
            console.debug('closeSystray');
            // Hide window
            win.hide();
            // Create a new tray if one isn't already
            if (!alwaysShowTray) {
                createTray();
            }
        } else {
            win.close(true);
        }
    });


}

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
         */
/*
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