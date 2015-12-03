/**
 * nw.js standalone systray
 */
if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) && (navigator.platform.toLowerCase().indexOf('mac') == -1)) {
    console.log("Not a mac");
    var tray, show, calendar, favorites, settings, about, exit;
    var alwaysShowTray = false;
    var gui = require('nw.gui');
    var win = gui.Window.get();
    // Create new empty menu
    var menu = new gui.Menu();

    // Remakes/Creates the tray as once a tray is removed it needs to be remade.
    var createTray = function() {
        tray = new gui.Tray({
            title: navigator.userAgent,
            icon: 'img/logo/icon64.png'
        });
        tray.tooltip = navigator.userAgent;
        tray.menu = menu;

        // Show DuckieTV on Click
        tray.on('click', function() {
            win.show();
            win.emit('restore');
        });
    };

    // If we're always showing the tray, create it now
    if (window.localStorage.getItem('standalone.alwaysShowTray') !== 'N') {
        alwaysShowTray = true;
        createTray();
    }

    // On Minimize Event
    win.on('minimize', function() {
        // Should we minimize to systray or taskbar?
        if (window.localStorage.getItem('standalone.minimizeSystray') !== 'N') {
            // Hide window
            win.hide();
            // Create a new tray if one isn't already
            if (window.localStorage.getItem('standalone.alwaysShowTray') !== 'Y') {
                createTray();
            }
        }
    });

    // On Restore Event
    win.on('restore', function() {
        // If we're not always showing tray, remove it
        if (tray && window.localStorage.getItem('standalone.alwaysShowTray') !== 'Y') {
            tray.remove();
        }
    });

    // On Close Event, fired before anything happens
    win.on('close', function() {
        if (window.localStorage.getItem('standalone.closeToTray') !== 'N') {
            // Hide window
            win.hide();
            // Create a new tray if one isn't already
            if (window.localStorage.getItem('standalone.alwaysShowTray') !== 'Y' || alwaysShowTray === false) {
                createTray();
            }
        } else {
            // Actually closes the window, bypassing any close events
            win.close(true);
        }
    });

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
        }
    });
    menu.append(calendar);

    // Add a favorites button
    favorites = new gui.MenuItem({
        label: "Show Favorites",
        click: function() {
            win.emit('standalone.favorites');
            win.show();
        }
    });
    menu.append(favorites);

    // Add a settings button
    settings = new gui.MenuItem({
        label: "Show Settings",
        click: function() {
            win.emit('standalone.settings');
            win.show();
        }
    });
    menu.append(settings);

    // Add a about button
    about = new gui.MenuItem({
        label: "Show About",
        click: function() {
            win.emit('standalone.about');
            win.show();
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