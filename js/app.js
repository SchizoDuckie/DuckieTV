/**
 * Handle global dependencies
 */
var DuckieTV = angular.module('DuckieTV', [
    'ui.router',
    'ct.ui.router.extras.core',
    'ct.ui.router.extras.sticky',
    'ngLocale',
    'ngAnimate',
    'tmh.dynamicLocale',
    'ui.bootstrap',
    'dialogs',
    'pascalprecht.translate',
    'DuckieTorrent.torrent'
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

.run(function($rootScope, $state) {
    $rootScope.$on('$stateChangeStart',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }
            Object.keys(toState.views).map(function(viewname) {
                document.querySelector("[ui-view=" + viewname + "]").classList.add('ui-loading')
            })
        });

    $rootScope.$on('$stateChangeSuccess',
        function(e, toState, toParams, fromState, fromParams) {
            if (!toState.views) {
                return;
            }

            Object.keys(toState.views).map(function(viewname) {
                document.querySelector("[ui-view=" + viewname + "]").classList.remove('ui-loading')
            })
        });
})