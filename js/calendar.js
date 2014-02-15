'use strict';

var Module = angular.module('datePicker');

Module.directive('calendar', function () {
  return {
    priority: 0,
    restrict: 'E',
    scope: true,
    template: function (attrs) {
    return '' +
          '<div ' +
          'date-picker ' +
          (attrs.view ? 'view="' + attrs.view + '" ' : 'view="date"') +
          (attrs.template ? 'template="' + attrs.template + '" ' : '') +
          'min-view="' + (attrs.minView || 'date') + '"' + '></div>';
    }, 
    link: function (scope) {
      scope.views = ['year', 'month', 'date'];
      scope.view =  'date';
     
      scope.$watch('events', function(value) {
        console.log("!!!Events changed!", value);
        scope.events = value;
      })
    },
  };
});