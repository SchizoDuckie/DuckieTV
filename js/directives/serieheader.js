/**
 * Generic serie header directive
 * Displays a poster of a banner from a tv show and provides navigation to it via the template
 */
DuckieTV.directive('serieheader', function() {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            'data': '=data',
            'noBadge': "=noBadge",
            'noListButton': "=noButton",
            "noOverview": "=noOverview",
            "noTitle": "=noTitle",
            "mode": "@"
        },
        templateUrl: function($node, $iAttrs) {
            return $iAttrs.seriesList ? "templates/serieslist/serieHeader.html" : "templates/serieHeader.html";
        },
    };
});
