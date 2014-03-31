/**
 * TheTVDB provider
 * Allows searching for series and get their episode listings
 */
angular.module('DuckieTV.directives.serieheader', [])

.directive('serieheader', function() {
    return {
        restrict: 'E',
        scope: {
            'serie': '=data',
            'noListButton': "=noButton",
            "noOverview": "=noOverview",
            "mode": "@"
        },
        templateUrl: "templates/serieHeader.html"
    }
})