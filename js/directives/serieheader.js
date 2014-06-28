/**
 * TheTVDB provider
 * Allows searching for series and get their episode listings
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
            "mode": "@",
            "added": "=added"
        },
        templateUrl: "templates/serieHeader.html",
    }
})