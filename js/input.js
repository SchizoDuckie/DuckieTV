'use strict';

var Module = angular.module('datePicker');

Module.directive('calendar', function () {
  return {
    restrict: 'E',
    templateUrl: 'templates/datepicker.html',
    scope: {
      start: '=',
      end: '=',
      events: '=',
      view: '=',
      views: '=',
    },

    link: function (scope) {
      $scope.views = $scope.views || ['year', 'month', 'date'];
      $scope.view = $scope.view || 'date';
      scope.$watch('start.getTime()', function (value) {
        if (value && scope.end && value > scope.end.getTime()) {
          scope.end = new Date(value);
        }
      });
      scope.$watch('end.getTime()', function (value) {
        if (value && scope.start && value < scope.start.getTime()) {
          scope.start = new Date(value);
        }
      });
      $scope.$watch('events', function(value) {
        $scope.events = events;
      })
    }
  };
}); 