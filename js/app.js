/**
 * Handle global dependencies
 */
var DuckieTV = angular.module('DuckieTV', [
    'formly',
    'formlyBootstrap',
    'xmlrpc',
    'ct.ui.router.extras.core',
    'ct.ui.router.extras.sticky',
    'ngLocale',
    'ngAnimate',
    'tmh.dynamicLocale',
    'ui.bootstrap',
    'dialogs.main',
    'pascalprecht.translate',
    'DuckieTorrent.torrent',
    'toaster',
    'angular-dialgauge'
])

/**
 * Unsafe HTML entities passthrough.
 * (Used for for instance typeAheadIMDB.html)
 */
.filter('unsafe', ["$sce",
    function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    }
])
/**
 * DuckietvReload service is injected whenever a window.location.reload is required,
 * which ensures that standalone gets some pre-processing done before actioning
*  the window.location.reload()  fixes #569
 */
.service('DuckietvReload', function() {
    var service = {
        windowLocationReload: function() {
            if ((navigator.userAgent.toLowerCase().indexOf('standalone') !== -1)) {
                // reload for standalones
                //console.debug('DuckietvReload for standalone');
                require('nw.gui').Window.get().emit('locationreload');
            } else {
                // reload for non-standalone
                //console.debug('DuckietvReload for non-standalone');
                window.location.reload();
            }
        }
    };
    return service;
})
/**
 * at start-up set up a timer to refresh DuckieTV a second after midnight, to force a calendar date refresh
 */
.run(["$injector", function($injector) {
    window.onload = function() {
        var today = new Date();
        var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        var timeToMidnight = (tommorow - today) + 1000; // a second after midnight
        // #569 test
         if (localStorage.getItem('mac_systray_reload_test')) {
            timeToMidnight = 15000; // 15 second reload test for mac/linux systray
         };
         // end #569 test
        var timer = setTimeout(function() {
            $injector.get('DuckietvReload').windowLocationReload();
        }, timeToMidnight);
    }
}])

.run(["$rootScope", "$state", function($rootScope, $state) {
    $rootScope.$on('$stateChangeStart',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }
            Object.keys(toState.views).map(function(viewname) {
                var view = document.querySelector("[ui-view=" + viewname.split('@')[0] + "]");
                if (view) view.classList.add('ui-loading');
            });
        });

    $rootScope.$on('$stateChangeSuccess',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }
            Object.keys(toState.views).map(function(viewname) {
                var view = document.querySelector("[ui-view=" + viewname.split('@')[0] + "]");
                if (view) view.classList.remove('ui-loading');
            });
        });
}]);
