DuckieTV.controller('WindowCtrl', ["$scope",
    function($scope) {

    	/**
    	 * All nw.js specific window settings are stored in localStorage because
    	 * they need to be accessed before DuckieTV starts up
    	 */

    	$scope.startupMinimized = (localStorage.getItem('standalone.startupMinimized') === 'Y');
    	$scope.alwaysShowTray = localStorage.getItem('standalone.alwaysShowTray');
    	$scope.minimizeToTray = localStorage.getItem('standalone.minimizeSystray');
        $scope.closeToTray = localStorage.getItem('standalone.closeSystray');

        // Toggles whether to minimize the Standalone window at start-up 
        $scope.toggleStartupMinimized = function() {
        	console.log("Minimize Startup", $scope.startupMinimized);
            $scope.startupMinimized = !$scope.startupMinimized;
            localStorage.setItem('standalone.startupMinimized', $scope.startupMinimized ? 'Y' : 'N');
        };

        // Toggles whether minimize button minimizes to tray
        $scope.toggleAlwaysShowTray = function() {
        	console.log("Always show tray", $scope.alwaysShowTray);
            localStorage.setItem('standalone.alwaysShowTray', $scope.alwaysShowTray);
        };

        // Toggles whether minimize button minimizes to tray
        $scope.toggleMinimizeToTray = function() {
        	console.log("Minimize to tray", $scope.minimizeToTray);
            localStorage.setItem('standalone.minimizeSystray', $scope.minimizeToTray);
        };

        // Toggles whether close button minimizes to tray
        $scope.toggleCloseToTray = function() {
        	console.log("Close to tray", $scope.closeToTray);
            localStorage.setItem('standalone.closeSystray', $scope.closeToTray);
        };
    }
]);