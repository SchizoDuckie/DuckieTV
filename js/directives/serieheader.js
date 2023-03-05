/**
 * Generic serie header directive
 * Displays a poster of a banner from a tv show and provides navigation to it via the template
 */
DuckieTV.directive('serieheader', ['FanartService', function (FanartService) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'data': '=data',
      'noBadge': '=noBadge',
      'noListButton': '=noButton',
      'noOverview': '=noOverview',
      'noTitle': '=noTitle'
    },
    templateUrl: 'templates/serieHeader.html',
    link: function ($scope, element, attrs) {
      $scope.posterUrl = $scope.data.poster
      if (!$scope.data.poster) {
        $scope.posterUrl = '_loading'

        FanartService.getShowImages($scope.data).then(function (fanart) {
          $scope.posterUrl = fanart?.poster

          // mutate poster on serie, this is a hack to mutate the data for the trakt side panel when you click on a show
          $scope.data.poster = fanart?.poster
          $scope.$digest()
        })
      }
    }
  }
}])
