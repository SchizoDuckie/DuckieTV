/**
 * calendarDemoApp - 0.1.3
 */
angular.module('SeriesGuide.calendar', ['ui.calendar', 'ui.bootstrap'])

.controller('CalendarCtrl', function ($scope) {
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    
    /* event source that contains custom events on the scope */
    $scope.events = [
       {title: 'All Day Event',start: new Date(y, m, 1)},
      {id: 999,title: 'Repeating Event',start: new Date(y, m, d - 3, 16, 0),allDay: false},
      {id: 999,title: 'Repeating Event',start: new Date(y, m, d + 4, 16, 0),allDay: false},
      {title: 'Birthday Party',start: new Date(y, m, d + 1, 19, 0),end: new Date(y, m, d + 1, 22, 30),allDay: false},
      {title: 'Person Of Interest',start: new Date(y, m, 28),end: new Date(y, m, 28),url: '#/series/248742'},
      {title: 'Arrow',start: new Date(y, m, 28),end: new Date(y, m, 28),url: '#/series/257655'}
  
    ];
  
    
    /* config object */
    $scope.uiConfig = {
      calendar:{
        height: 200,
        editable: true,
        header:{
          left: 'title',
          center: '',
          right: 'today prev,next'
        },
        eventClick: $scope.alertOnEventClick,
        eventDrop: $scope.alertOnDrop,
        eventResize: $scope.alertOnResize
      }
    };

    /* event sources array*/
    $scope.eventSources = [$scope.events,]
});
/* EOF */