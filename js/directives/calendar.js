angular.module('DuckieTV.directives.calendar', ['DuckieTV.providers.favorites'])

.factory('CalendarEvents', function($rootScope, FavoritesService) {
    var calendarEvents = {

    };
    var service = {
        setDate: function(date, range) {
            console.log('setDate!', date, range || $rootScope.getSetting('calendar.mode'));
            range = range || $rootScope.getSetting('calendar.mode');
            var endDate = new Date(date);
            var startDate = new Date(date);
            switch (range) {
                case 'week':
                    startDate.setDate(startDate.getDate() - startDate.getDay());
                    endDate.setDate(endDate.getDate() + (7 - endDate.getDay()));
                    break;
                case 'date':
                    endDate.setDate(40);
                    startDate.setDate(-47);
                    break;
            }
            service.getEventsForDateRange(startDate, endDate);
        },
        getEventsForDateRange: function(start, end) {
            FavoritesService.getEpisodesForDateRange(start.getTime(), end.getTime()).then(function(data) {
                var serieIDs = {};
                for (var i = 0; i < data.length; i++) {
                    serieIDs[data[i].get('ID_Serie')] = data[i].get('ID_Serie');
                }
                CRUD.Find('Serie', ['ID_Serie in (' + Object.keys(serieIDs).join(',') + ')']).then(function(results) {
                    var cache = {};
                    var events = [];
                    for (var i = 0; i < results.length; i++) {
                        cache[results[i].getID()] = results[i];
                    }
                    for (var i = 0; i < data.length; i++) {
                        events.push({
                            start: new Date(data[i].get('firstaired')),
                            serie: cache[data[i].get('ID_Serie')].get('name'),
                            serieID: cache[data[i].get('ID_Serie')].get('TVDB_ID'),
                            episode: data[i]
                        });
                    }
                    cache = null;
                    service.setEvents(events);
                })
            });
        },
        clearCache: function() {
            calendarEvents = {};
        },
        /** 
         * Merge any incoming new events with the events already in calendarEvents.
         * Adds them otherwise.
         * THe calendarEvents cache is updated per day so the calendar doesn't refresh unnneccesarily
         */
        setEvents: function(events) {
            for (var i = 0; i < events.length; i++) {
                var date = new Date(new Date(events[i].start).getTime()).toDateString();

                if (!(date in calendarEvents)) {
                    calendarEvents[date] = [];
                }
                var existing = calendarEvents[date].filter(function(el) {
                    return el.serieID == events[i].serieID && el.start.toDateString() == events[i].start.toDateString()
                });
                if (existing.length == 0) {
                    calendarEvents[date].push(events[i]);
                } else {
                    existing[0].episode = events[i].episode;
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

    $rootScope.$on('episodes:updated', function(event) {
        service.setDate(new Date());
    });
    $rootScope.$on('calendar:clearcache', function() {
        service.clearCache();
    });
    $rootScope.$on('setDate', function(evt, date, range) {
        service.setDate(date, range);
    });
    return service;
})

.directive('calendarEvent', function() {
    return {
        restrict: 'E',
        scope: {
            event: '='
        },
        templateUrl: 'templates/event.html',
        link: function($scope) {
            $scope.$on('magnet:select:' + $scope.event.episode.get('TVDB_ID'), function(evt, magnet) {
                console.debug("Found a magnet selected!", magnet);
                $scope.event.episode.set('magnetHash', magnet);
                $scope.event.episode.Persist();
            });

            $scope.$on('episode:watched' + $scope.event.episode.getID(), function(evt, episode) {
                console.log("Episode watched!", evt, episode);
                $scope.event.episode = episode;
            })
        }
    }
})

.directive('calendar', function(FavoritesService, CalendarEvents, $rootScope) {

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

            CalendarEvents.setDate(new Date(), $rootScope.getSetting('calendar.mode'));

        },
    };
});