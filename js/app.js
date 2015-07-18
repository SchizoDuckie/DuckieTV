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
 * at start-up set up a timer to refresh DuckieTV a second after midnight, to force a calendar date refresh
 */
.run(
    window.onload = function() {
        var today = new Date();
        var tommorow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        var timeToMidnight = (tommorow - today) + 1000; // a second after midnight
        var timer = setTimeout(function() {
            window.location.reload();
        }, timeToMidnight);
    }
)

.config(function($modalProvider) {
    $modalProvider.options.animation = false;
    // temp fix for ui-bootstrap modals not showing
})

.run(function($rootScope, $state) {
    $rootScope.$on('$stateChangeStart',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }
            Object.keys(toState.views).map(function(viewname) {
                var view = document.querySelector("[ui-view=" + viewname.split('@')[0] + "]");
                if (view) view.classList.add('ui-loading')
            })
        });

    $rootScope.$on('$stateChangeSuccess',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }

            Object.keys(toState.views).map(function(viewname) {
                var view = document.querySelector("[ui-view=" + viewname.split('@')[0] + "]");
                if (view) view.classList.remove('ui-loading')
            })
        });
});