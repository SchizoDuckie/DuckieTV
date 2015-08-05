/**
 * Window decorations and position storage for DuckieTV standalone.
 * Stores window position in localStorage on app close
 * Restores window position when available in localStorage
 * Auto minimizes app when indicated in localStorage
 * Adds event click handlers to the window decoration items in the DOM.
 *
 * Runs outside angular so that the scripts can be kept nicely clean and separated
 */
if (navigator.userAgent.toLowerCase().indexOf('standalone') !== -1) {

    var gui = require('nw.gui');

    // Reference to window and tray
    var win = gui.Window.get();

    if (localStorage.getItem('standalone.position')) {
        var pos = JSON.parse(localStorage.getItem('standalone.position'));
        win.resizeTo(parseInt(pos.width), parseInt(pos.height));
        win.moveTo(parseInt(pos.x), parseInt(pos.y));
    }

    if (localStorage.getItem('standalone.startupMinimized')) {
        win.minimize();
    }

    window.addEventListener('DOMContentLoaded', function() {

        // add standalone window decorators
        document.body.classList.add('standalone');

        // and handle their events.
        document.getElementById('close').addEventListener('click', function() {
            localStorage.setItem('standalone.position', JSON.stringify({
                width: window.innerWidth,
                height: window.innerHeight,
                x: window.screenX,
                y: window.screenY
            }));
            win.close(true); // we call window.close so that the close event can fire
        });

        document.getElementById('minimize').addEventListener('click', function() {
            win.minimize();
        });

        var maximize = document.getElementById('maximize'),
            unmaximize = document.getElementById('unmaximize');

        // show/hide maximize/unmaximize button on toggle.
        maximize.addEventListener('click', function() {
            maximize.style.display = 'none';
            unmaximize.style.display = '';
            win.maximize();
        });

        unmaximize.addEventListener('click', function() {
            unmaximize.style.display = 'none';
            maximize.style.display = '';
            win.unmaximize();
        });
    });
}