angular.module('DuckieTV.directives.calendar', ['DuckieTV.providers.favorites'])

.factory('CalendarEvents', function($rootScope, FavoritesService) {
    var calendarEvents = {

    };
    $rootScope.$on('setDate', function(evt, date, range, g) {
        console.log('setDate!', date, range);
        var endDate = new Date(date);
        var startDate = new Date(date);
        switch (range) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                endDate.setDate(endDate.getDate() + 7);
                break;
            case 'date':
                endDate.setDate(40);
                startDate.setDate(-47);
                break;
        }
        service.getEventsForDateRange(startDate, endDate);
    })
    var service = {
        getEventsForDateRange: function(start, end) {
            console.log("Geteventsfordate!", start, end);
            FavoritesService.getEpisodesForDateRange(start.getTime(), end.getTime()).then(function(data) {
                var serieIDs = {};
                for (var i = 0; i < data.length; i++) {
                    serieIDs[data[i].get('ID_Serie')] = data[i].get('ID_Serie');
                }
                CRUD.Find('Serie', ['ID_Serie in (' + Object.keys(serieIDs).join(',') + ')']).then(function(results) {
                    var offset = new Date().getTimezoneOffset() > 0 ? new Date().getTimezoneOffset() * 60 * 1000 : 0;
                    var cache = {};
                    var events = [];
                    for (var i = 0; i < results.length; i++) {
                        cache[results[i].getID()] = results[i];
                    }
                    for (var i = 0; i < data.length; i++) {
                        events.push({
                            start: new Date((new Date(data[i].get('firstaired')).getTime() + offset)),
                            serie: cache[data[i].get('ID_Serie')].get('name'),
                            serieID: cache[data[i].get('ID_Serie')].get('TVDB_ID'),
                            episode: data[i]
                        });
                    }
                    service.setEvents(events);
                })
            });
        },
        setEvents: function(events) {
            calendarEvents = {};
            for (var i = 0; i < events.length; i++) {
                //var offset = new Date().getTimezoneOffset() > 0 ? new Date().getTimezoneOffset() * 60 * 1000 : 0;
                var date = new Date(new Date(events[i].start).getTime()).toDateString();

                if (!(date in calendarEvents)) {
                    calendarEvents[date] = [];
                }
                var existing = calendarEvents[date].filter(function(el) {
                    return el.serieID == events[i].serieID && el.start == events[i].start
                });
                if (existing.length == 0) {
                    calendarEvents[date].push(events[i]);
                }
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
    };

    return service;
})

.directive('calendarEvent', function() {
    return {
        restrict: 'E',
        scope: {
            event: '='
        },
        templateUrl: 'templates/event.html'
    }
})

.directive('calendar', function(FavoritesService, CalendarEvents, $rootScope) {

    this.update = function($rootScope) {

    };


    return {
        restrict: 'E',
        template: function(element, attrs) {
            console.log("template: ", attrs);
            return '' +
                '<div ' +
                'date-picker ' +
                (attrs.eventService ? 'event-service="' + attrs.eventService + '"' : '') +
                (attrs.view ? 'view="' + attrs.view + '" ' : 'view="week"') +
                (attrs.template ? 'template="' + attrs.template + '" ' : '') +
                'min-view="' + (attrs.minView || 'date') + '"' + '></div>';
        },
        link: function($scope) {
            $scope.views = ['year', 'month', 'week', 'date'];
            $scope.view = 'week';

            this.update(new Date(), 'week');
            $rootScope.$on('episodes:updated', function(event) {
                this.update(new Date(), $scope.view);
            });


            $rootScope.eventClick = function(evt) {
                console.debug("vent click!", evt);
            }
        },
    };
});