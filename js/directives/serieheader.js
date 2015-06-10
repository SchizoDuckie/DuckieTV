/**
 * Generic serie header directive
 * Displays a poster of a banner from a tv show and provides navigation to it via the template
 */
DuckieTV.directive('serieheader', ["FavoritesService",
    function(FavoritesService) {
        return {
            restrict: 'E',
            transclude: true,
            scope: {
                'data': '=data',
                'noListButton': "=noButton",
                "noOverview": "=noOverview",
                "noTitle": "=noTitle",
                "mode": "@"
            },
            templateUrl: "templates/serieHeader.html"
        };
    }
]);