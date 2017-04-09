DuckieTV.run(['$rootScope', "SettingsService",
    function($rootScope, SettingsService) {
        /**
         * nw.js standalone systray
         */
        if (SettingsService.isStandalone()) {
            var tray = null,
                showdtv, calendar, favorites, settings, about, exit, traymenu;
            var win = nw.Window.get();
            var alwaysShowTray = (localStorage.getItem('standalone.alwaysShowTray') === 'Y');
            var trayColor = ''; // default colour of the tray icon
            if (localStorage.getItem('standalone.trayColor')) {
                trayColor = localStorage.getItem('standalone.trayColor');
            }
            var winState = 'normal';
            if (localStorage.getItem('standalone.position')) {
                var pos = JSON.parse(localStorage.getItem('standalone.position'));
                winState = pos.state;
            };

            // debugging
            //console.debug('debugging source version=3');
            //console.debug('standalone.alwaysShowTray=' + localStorage.getItem('standalone.alwaysShowTray'));
            //console.debug('standalone.startupMinimized=' + localStorage.getItem('standalone.startupMinimized'));
            //console.debug('minimizeSystray=' + localStorage.getItem('standalone.minimizeSystray'));
            //console.debug('closeSystray=' + localStorage.getItem('standalone.closeSystray'));

            // Create the menu, only needs to be made once
            traymenu = new nw.Menu();
            // Add a show button
            showdtv = new nw.MenuItem({
                label: "Show DuckieTV",
                click: function() {
                    //console.debug('menu showdtv: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                }
            });
            traymenu.append(showdtv);

            // Add a ADLStatus button
            adlstatus = new nw.MenuItem({
                label: "Show ADLStatus",
                enabled: (SettingsService.get('torrenting.enabled') && SettingsService.get('torrenting.autodownload')),
                click: function() {
                    $rootScope.$emit('standalone.adlstatus');
                    //console.debug('menu adlstatus: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                }
            });
            traymenu.append(adlstatus);

            // Add a calendar button
            calendar = new nw.MenuItem({
                label: "Show Calendar",
                click: function() {
                    $rootScope.$emit('standalone.calendar');
                    //console.debug('menu calendar: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                }
            });
            traymenu.append(calendar);

            // Add a favorites button
            favorites = new nw.MenuItem({
                label: "Show Favorites",
                click: function() {
                    $rootScope.$emit('standalone.favorites');
                    //console.debug('menu favorites: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                }
            });
            traymenu.append(favorites);

            // Add a settings button
            settings = new nw.MenuItem({
                label: "Show Settings",
                click: function() {
                    $rootScope.$emit('standalone.settings');
                    //console.debug('menu settings: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                }
            });
            traymenu.append(settings);

            // Add a about button
            about = new nw.MenuItem({
                label: "Show About",
                click: function() {
                    $rootScope.$emit('standalone.about');
                    //console.debug('menu about: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                }
            });
            traymenu.append(about);

            // Add a separator
            traymenu.append(new nw.MenuItem({
                type: 'separator'
            }));

            // Add a exit button
            exit = new nw.MenuItem({
                label: "Exit",
                click: function() {
                    //win.close(true);
                    nw.App.quit();
                },
                key: "q",
                modifiers: "cmd",
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
                tray = new nw.Tray({
                    icon: 'img/logo/icon64' + trayColor + '.png'
                });
                //console.debug('createTray: tray created id=',tray.id);
                tray.on('click', function() {
                    //console.debug('tray.on click: emit.restoredtv');
                    $rootScope.$emit('restoredtv');
                });

                tray.tooltip = navigator.userAgent;
                //tray.tooltip = 'id='+tray.id;
                tray.menu = traymenu;
            };

            // If we're always showing the tray, create it now (default is N or null)
            if (localStorage.getItem('standalone.alwaysShowTray') === 'Y') {
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
                if (localStorage.getItem('standalone.minimizeSystray') === 'Y') {
                    //console.debug('on minimize: minimizeSystray');
                    // Hide window
                    win.hide();
                    // Create a new tray if one isn't already
                    createTray();
                }
            });

            // On Restore Event
            $rootScope.$on('restoredtv', function() {
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
                if (localStorage.getItem('standalone.closeSystray') === 'Y') {
                    //console.debug('closeSystray');
                    // Hide window
                    win.hide();
                    // Create a new tray if one isn't already
                    createTray();
                } else {
                    //win.close(true);
                    nw.App.quit();
                }
            });

            // on winstate event, update winState
            $rootScope.$on('winstate', function(winstate) {
                //console.debug('winState=',winstate);
                winState = winstate;
            });

            // on locationreload event, delete tray and listeners.
            // swap out normal window.location.reload function for a wrapper that does this for ease of use.
            window.location._reload = window.location.reload;

            function removeTray() {

                if (tray !== null) {
                    //console.debug('on locationreload: tray.remove id=',tray.id);
                    tray.remove();
                    tray = null;
                };
                win.removeAllListeners();
                //console.debug('on locationreload: window.location.reload()');
            }

            window.location.reload = function() {
                console.warn("Reloading!!");
                removeTray();
                window.location._reload();
            }

            window.addEventListener('unload', function() {

                removeTray();
            }, false);
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
    }
]);