DuckieTV.run(['$rootScope', 'SettingsService',
    function($rootScope, SettingsService) {
    /**
     * Chrome compatible zoom keyboard control implementation for nw.js
     * Zoomlevel is stored in localStorage because this code runs early.
     * Also attaches DevTools F12 key handler
     */
    if (SettingsService.isStandalone()) {

        var win = nw.Window.get(),
            zoomLevels = [25, 33, 50, 67, 75, 90, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500],
            zoomIndex = 'standalone.zoomlevel' in localStorage ? parseInt(localStorage.getItem('standalone.zoomlevel')) : 6,
            setZoomLevel = function(index) {
                if (index < 0) {
                    index = 0;
                }
                if (index > 15) {
                    index = 15;
                }
                zoomIndex = index;
                win.zoomLevel = Math.log(zoomLevels[index] / 100) / Math.log(1.2);
                localStorage.setItem('standalone.zoomlevel', zoomIndex);
            };

        setZoomLevel(zoomIndex);

        // get the zoom command events
        window.addEventListener('keydown', function(event) {

            switch (event.keyCode) {
                case 123: // F12, show inspector
                    win.showDevTools();
                    break;
                case 187: // +
                    if (event.ctrlKey) {
                        setZoomLevel(zoomIndex + 1);
                    }
                    break;
                case 189: // -
                    if (event.ctrlKey) {
                        setZoomLevel(zoomIndex - 1);
                    }
                    break;
                case 48: // 0
                    if (event.ctrlKey) {
                        setZoomLevel(6);
                    }
                    break;
            }
        });

    }
}]);