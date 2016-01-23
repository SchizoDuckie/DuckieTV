/**
 * nw.js standalone systray
 */
if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1)) {
    var tray = null,
        showdtv, calendar, favorites, settings, about, exit, traymenu;
    var gui = require('nw.gui');
    var win = gui.Window.get();
    var alwaysShowTray = (window.localStorage.getItem('standalone.alwaysShowTray') === 'Y');
    var winState = 'normal';
    if (localStorage.getItem('standalone.position')) {
        var pos = JSON.parse(localStorage.getItem('standalone.position'));
        winState = pos.state;
    };
    
    // debugging
    //console.debug('debugging source version=3');
    //console.debug('standalone.alwaysShowTray='+window.localStorage.getItem('standalone.alwaysShowTray'));
    //console.debug('standalone.startupMinimized='+window.localStorage.getItem('standalone.startupMinimized'));
    //console.debug('minimizeSystray='+window.localStorage.getItem('standalone.minimizeSystray'));
    //console.debug('closeSystray='+window.localStorage.getItem('standalone.closeSystray'));

    // Create the menu, only needs to be made once
    traymenu = new gui.Menu();
    // Add a show button
    showdtv = new gui.MenuItem({
        label: "Show DuckieTV",
        click: function() {
            //console.debug('menu showdtv: emit.restoredtv');
            win.emit('restoredtv');
        }
    });
    traymenu.append(showdtv);

    // Add a calendar button
    calendar = new gui.MenuItem({
        label: "Show Calendar",
        click: function() {
            win.emit('standalone.calendar');
            //console.debug('menu calendar: emit.restoredtv');
            win.emit('restoredtv');
        }
    });
    traymenu.append(calendar);

    // Add a favorites button
    favorites = new gui.MenuItem({
        label: "Show Favorites",
        click: function() {
            win.emit('standalone.favorites');
            //console.debug('menu favorites: emit.restoredtv');
            win.emit('restoredtv');
        }
    });
    traymenu.append(favorites);

    // Add a settings button
    settings = new gui.MenuItem({
        label: "Show Settings",
        click: function() {
            win.emit('standalone.settings');
            //console.debug('menu settings: emit.restoredtv');
            win.emit('restoredtv');
        }
    });
    traymenu.append(settings);

    // Add a about button
    about = new gui.MenuItem({
        label: "Show About",
        click: function() {
            win.emit('standalone.about');
            //console.debug('menu about: emit.restoredtv');
            win.emit('restoredtv');
        }
    });
    traymenu.append(about);

    // Add a separator
    traymenu.append(new gui.MenuItem({
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
    traymenu.append(exit);
    //console.debug('menu created');

    // Remakes/Creates the tray as once a tray is removed it needs to be remade.
    var createTray = function() {
        if (tray !== null) {
            // tray exists, do nothing
            //console.debug('createTray: tray exists id=',tray.id);
            return true;
         };
        tray = new gui.Tray({
            title: navigator.userAgent,
            icon: 'img/logo/icon64.png'
        });
        //console.debug('createTray: tray created id=',tray.id);
        tray.on('click', function() {
            win.emit('standalone.calendar');
            //console.debug('tray.on click: emit.restoredtv');
            win.emit('restoredtv');
        });

        tray.tooltip = navigator.userAgent;
        //tray.tooltip = 'id='+tray.id;
        tray.menu = traymenu;
    };

    // If we're always showing the tray, create it now (default is N or null)
    if (window.localStorage.getItem('standalone.alwaysShowTray') === 'Y') {
        //console.debug('alwaysShowTray');
        createTray();
    };

    // create tray if are we going to minimize after start-up (default is N or null)
    if (localStorage.getItem('standalone.startupMinimized') === 'Y') {
        //console.debug('startupMinimized');
        // Create a new tray if one isn't already
        createTray();
    };

    // On Minimize Event
    win.on('minimize', function() {
        // Should we minimize to systray or taskbar? (default is N or null)
        //console.debug('on minimize');
        if (window.localStorage.getItem('standalone.minimizeSystray') === 'Y') {
            //console.debug('on minimize: minimizeSystray');
            // Hide window
            win.hide();
            // Create a new tray if one isn't already
            createTray();
        }
    });

    // On Restore Event
    win.on('restoredtv', function() {
        //console.debug('on restoredtv');
        win.show();
        // If we're not always showing tray, remove it
        if (tray !== null && !alwaysShowTray) {
            //console.debug('on restoredtv: tray.remove id=',tray.id);
            tray.remove();
            tray = null;
        };
        if (winState == 'maximized') {
            setTimeout(function() {
                win.maximize();
            }, 150);
        }
    });

    // On Close Event, fired before anything happens
    win.on('close', function() {
        // does close mean go to systray? (default N or null)
        if (window.localStorage.getItem('standalone.closeSystray') === 'Y') {
            //console.debug('closeSystray');
            // Hide window
            win.hide();
            // Create a new tray if one isn't already
            createTray();
        } else {
            win.close(true);
        }
    });

    // on winstate event, update winState
    win.on('winstate', function(winstate) {
        //console.debug('winState=',winstate);
        winState = winstate;
    });
    
    // on locationreload event, delete tray and listeners
    win.on('locationreload', function() {
        if (tray !== null) {
            //console.debug('on locationreload: tray.remove id=',tray.id);
            tray.remove();
            tray = null;
        };
        win.removeAllListeners();
        //console.debug('on locationreload: window.location.reload()');
        window.location.reload();
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
