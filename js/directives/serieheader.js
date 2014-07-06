/**
 * Generic serie header directive
 * Displays a poster of a banner from a tv show and provides navigation to it via the template
 */
angular.module('DuckieTV.directives.serieheader', [])

.directive('serieheader', function(FavoritesService) {
    return {
        restrict: 'E',
        transclude: true,
        scope: {
            'serie': '=data',
            'noListButton': "=noButton",
            "noOverview": "=noOverview",
            "noTitle": "=noTitle",
            "mode": "@",
            "added": "=added"
        },
        templateUrl: "templates/serieHeader.html"
    };
});