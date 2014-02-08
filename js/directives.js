/**
 * TheTVDB provider
 * Allows searching for series and get their episode listings
 */
 angular.module('SeriesGuide.directives',[])

.directive('serieheader', function () {
  return {
    restrict: 'E',
    scope: { 'serie': '=data', 'noListButton': "=noButton", "noOverview": "=noOverview" },
    templateUrl: "templates/serieHeader.html"
 }
})
