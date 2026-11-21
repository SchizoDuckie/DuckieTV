DuckieTV.directive('inAppAlerts', ['InAppAlerts', function(InAppAlerts) {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'templates/inAppAlerts.html',
    link: function(scope) {
      scope.alerts = InAppAlerts
    }
  }
}])
