DuckieTV.controller('WindowCtrl', ["$scope", "$injector", "$filter",
    function($scope, $injector, $filter) {

        /**
         * All nw.js specific window settings are stored in localStorage because
         * they need to be accessed before DuckieTV starts up
         */

        $scope.startupMinimized = (localStorage.getItem('standalone.startupMinimized') === 'Y');
        $scope.alwaysShowTray = localStorage.getItem('standalone.alwaysShowTray');
        $scope.minimizeToTray = localStorage.getItem('standalone.minimizeSystray');
        $scope.closeToTray = localStorage.getItem('standalone.closeSystray');
        $scope.activeTrayColor = 'black'; // default color of the tray icon
        if (localStorage.getItem('standalone.trayColor')) {
            $scope.activeTrayColor = (localStorage.getItem('standalone.trayColor') === '') ? 'black' : localStorage.getItem('standalone.trayColor').replace('-', '').replace('inverted', 'white');
        }
        $scope.colorList = 'black|white|red|orange|yellow|green|blue|indigo|violet'.split('|'); // used by $scope.translateColor()
        var translatedColorList = $filter('translate')('COLORLIST').split('|');

        // Takes the English color and returns a translation
        $scope.translateColor = function(color) {
            var idx = $scope.colorList.indexOf(color);
            return (idx != -1) ? translatedColorList[idx] : color;
        };

        // Toggles whether to minimize the Standalone window at start-up 
        $scope.toggleStartupMinimized = function() {
            $scope.startupMinimized = !$scope.startupMinimized;
            //console.debug("Minimize Startup", $scope.startupMinimized);
            localStorage.setItem('standalone.startupMinimized', $scope.startupMinimized ? 'Y' : 'N');
        };

        // Toggles whether minimize button minimizes to tray
        $scope.toggleAlwaysShowTray = function() {
            //console.debug("Always show tray", $scope.alwaysShowTray);
            localStorage.setItem('standalone.alwaysShowTray', $scope.alwaysShowTray);
            window.location.reload();
        };

        // Toggles whether minimize button minimizes to tray
        $scope.toggleMinimizeToTray = function() {
            //console.debug("Minimize to tray", $scope.minimizeToTray);
            localStorage.setItem('standalone.minimizeSystray', $scope.minimizeToTray);
        };

        // Toggles whether close button minimizes to tray
        $scope.toggleCloseToTray = function() {
            //console.debug("Close to tray", $scope.closeToTray);
            localStorage.setItem('standalone.closeSystray', $scope.closeToTray);
        };

        // Sets the colour of the tray icon
        $scope.setTrayColor = function(color) {
            switch (color) {
                case 'black': 
                    localStorage.setItem('standalone.trayColor', '');
                    break;
                case 'white': 
                    localStorage.setItem('standalone.trayColor', '-inverted');
                    break;
                default:
                    localStorage.setItem('standalone.trayColor', '-'+color);
            }
            $scope.activeTrayColor = color;
            window.location.reload();
        };
    }
]);
