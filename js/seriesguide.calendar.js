/**
 * calendarDemoApp - 0.1.3
 */
angular.module('SeriesGuide.calendar', ['ui.calendar', 'ui.bootstrap','SeriesGuide.providers'])

.controller('CalendarCtrl', function ($scope, FavoritesService) {
    var date = new Date();
    var d = date.getDate();
    var m = date.getMonth();
    var y = date.getFullYear();
    
    this.update = function() {
      FavoritesService.getEpisodesForDateRange("2014-01-01", "2015-01-01").then(function(data) {
          var serieIDs = { };
          for(var i=0; i<data.length; i++) {
            serieIDs[data[i].get('ID_Serie')] = data[i].get('ID_Serie');
          }
          CRUD.Find('Serie', ['ID_Serie in ('+Object.keys(serieIDs).join(',')+')']).then(function(results) {
             var events = [];
             console.log("RESULTS FOR SERIES! ", serieIDs, results, data);
             var cache = {};
             $scope.events.length = 0;
             for(var i=0; i<results.length; i++) {
                cache[results[i].getID()] = results[i];
             }
             for(var i=0; i< data.length; i++) {
               $scope.events.push({start : new Date(data[i].get('firstaired')), title: [
                cache[data[i].get('ID_Serie')].get('name')/*
                data[i].getFormattedEpisode(),
                 ,data[i].get('episodename') */].join(' ') });
             }

             console.log("Events updated!", $scope.events);
             $scope.$digest();
          })
      });
    }

    $scope.$on('episodes:updated', function(event,data) {
     this.update();
   }.bind(this));

    /* event source that contains custom events on the scope */
   $scope.events = [
     
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

    this.update();

    /* event sources array*/
    $scope.eventSources = [$scope.events]
});
/* EOF */