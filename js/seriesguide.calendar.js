angular.module('SeriesGuide.calendar', ['SeriesGuide.providers','ngAnimate'])

.provider('CalendarEvents', function() {
    var calendarEvents = {};  
    return {
        $get: function($rootScope) { 
          return {
            setEvents: function(events) { 
             calendarEvents = {};
             for(var i=0; i<events.length; i++) {
                var date = new Date(events[i].start).toDateString();
                if(!(date in calendarEvents)) {
                  calendarEvents[date] = [];
                }
                calendarEvents[date].push(events[i]);
              }
              $rootScope.$broadcast('calendar:events', events);
            },
            hasEvent: function(date) {
              return (new Date(date).toDateString() in calendarEvents);
            },
            getEvents: function(date) {
              var date = new Date(date).toDateString();
              return calendarEvents[date];
            }
          }
        }
    }
})

.directive('calendar', function (FavoritesService, CalendarEvents, $rootScope)  {
   
   this.update = function($rootScope) {
      FavoritesService.getEpisodesForDateRange("2014-01-01", "2015-01-01").then(function(data) {
          var serieIDs = { };
          for(var i=0; i<data.length; i++) {
            serieIDs[data[i].get('ID_Serie')] = data[i].get('ID_Serie');
          }
          CRUD.Find('Serie', ['ID_Serie in ('+Object.keys(serieIDs).join(',')+')']).then(function(results) {
             var cache = {};
             var events = [];
             for(var i=0; i<results.length; i++) {
                cache[results[i].getID()] = results[i];
             }
             for(var i=0; i< data.length; i++) {
                events.push({
                  start : new Date(data[i].get('firstaired')), 
                  serie: cache[data[i].get('ID_Serie')].get('name'),
                  episode: data[i],
                  templateUrl: 'templates/calendar.episode'
                });
             }
             CalendarEvents.setEvents(events);
          })
      });
    };


    return {
      restrict: 'E',
      template: function (element, attrs) {
        console.log("template: ", attrs);
      return '' +
            '<div ' +
            'date-picker ' +
            (attrs.eventService ? 'event-service="'+attrs.eventService+'"' : '')+
            (attrs.view ? 'view="' + attrs.view + '" ' : 'view="date"') +
            (attrs.template ? 'template="' + attrs.template + '" ' : '') +
            'min-view="' + (attrs.minView || 'date') + '"' + '></div>';
      }, 
      link: function ($scope) {
        $scope.views = ['year', 'month', 'date'];
        $scope.view =  'date';

        this.update();
        $rootScope.$on('episodes:updated', function(event) {
          this.update();
        });
      },
    };
});