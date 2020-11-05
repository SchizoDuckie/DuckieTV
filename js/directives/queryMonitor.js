DuckieTV.directive('queryMonitor', ['$timeout', '$rootScope', function($timeout, $rootScope) {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: 'templates/querymonitor.html',
    link: function($scope) {
      $scope.isRunning = false
      $scope.isFinished = false
      $scope.progress = 0
      $scope.data = {}

      $rootScope.$on('TraktUpdateService:update', function(event, data) {
        switch (data.type) {
          case 'start':
            $scope.progress = 0
            $scope.isRunning = true
            $scope.isFinished = false
            $scope.data = data.payload
            break
          case 'progress':
            $scope.data = data.payload
            $scope.progress = data.payload.current / data.payload.total * 100
            window.onbeforeunload = () => '' // need to return a string for it to work
            $scope.$digest()
            break
          case 'finish':
            $scope.data = data.payload
            $scope.progress = data.payload.current / data.payload.total * 100
            $scope.isFinished = true
            window.onbeforeunload = null
            $scope.$digest()

            // Small timeout before we hide it to show that it's done
            $timeout(function() {
              $scope.isRunning = false
            }, 1600)
            break
        }
      })
    }
  }
}])
