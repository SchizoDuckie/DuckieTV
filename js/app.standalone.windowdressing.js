DuckieTV.run(['$rootScope', 'SettingsService',
    function($rootScope, SettingsService) {
    /**
     * Window decorations and position storage for DuckieTV standalone.
     * Stores window position in localStorage on app close
     * Restores window position when available in localStorage
     * Auto minimizes app when indicated in localStorage
     * Adds event click handlers to the window decoration items in the DOM.
     */
    if (SettingsService.isStandalone()) {
        var win = nw.Window.get();
        var winState = 'normal';
        var pos, maximize, unmaximize;

        if (localStorage.getItem('standalone.position')) {
            pos = JSON.parse(localStorage.getItem('standalone.position'));
            win.resizeTo(parseInt(pos.width), parseInt(pos.height));
            win.moveTo(parseInt(pos.x), parseInt(pos.y));
            //console.debug('state=%s,h=%i,w=%i,x=%i,y=%i',pos.state,pos.height,pos.width,pos.x,pos.y);
            if (pos.state == 'maximized') {
                setTimeout(function() {
                    if (localStorage.getItem('standalone.startupMinimized') !== 'Y') {
                        win.maximize();
                    };
                    if (maximize && unmaximize) {
                        maximize.style.display = 'none';
                        unmaximize.style.display = '';
                    }
                }, 230);
                winState = 'maximized';
                $rootScope.$emit('winstate',winState);
            }
        }

        if (localStorage.getItem('standalone.startupMinimized') !== 'Y') {
            setTimeout(function() {
                win.show();
            }, 120);
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

            maximize = document.getElementById('maximize');
            unmaximize = document.getElementById('unmaximize');

            // show/hide maximize/unmaximize button on toggle.
            maximize.addEventListener('click', function() {
                maximize.style.display = 'none';
                unmaximize.style.display = '';
                win.maximize();
                winState = 'maximized';
                $rootScope.$emit('winstate',winState);
            });

            unmaximize.addEventListener('click', function() {
                unmaximize.style.display = 'none';
                maximize.style.display = '';
                win.unmaximize();
                winState = 'normal';
                $rootScope.$emit('winstate',winState);
            });
        });
    }
}]);