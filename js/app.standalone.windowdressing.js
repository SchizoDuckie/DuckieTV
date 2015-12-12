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
    var win = gui.Window.get();
    var winState = 'normal';

    if (localStorage.getItem('standalone.position')) {
        var pos = JSON.parse(localStorage.getItem('standalone.position'));
        win.resizeTo(parseInt(pos.width), parseInt(pos.height));
        win.moveTo(parseInt(pos.x), parseInt(pos.y));
        console.debug('standalone.position',pos);
        if (pos.state == 'maximized') {
            setTimeout(function() {
                win.maximize();
            }, 150);
        }
    }

    if (localStorage.getItem('standalone.startupMinimized') !== 'Y') {
        setTimeout(function() {
            win.show();
        }, 150);
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
                y: window.screenY,
                state: winState 

            }));
            win.close(); // we call window.close so that the close event can fire
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
            winState = 'maximized';
        });

        unmaximize.addEventListener('click', function() {
            unmaximize.style.display = 'none';
            maximize.style.display = '';
            win.unmaximize();
            winState = 'normal';
        });
    });
}