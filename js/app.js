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
    'datePicker',
    'ui.bootstrap',
    'dialogs.services',
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