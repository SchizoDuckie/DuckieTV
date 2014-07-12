angular.module('DuckieTV.directives.calendar', ['DuckieTV.providers.favorites'])

.factory('CalendarEvents', function($rootScope, FavoritesService) {
    var calendarEvents = {

    };
    var service = {
        /**
         * setDate gets fired by the vendor/datePicker directive whenever the user navigates the calendar with the arrows back and forth
         * It is hooked here so that the range can be determined (either one week or one whole month) and fetches episodes for that range
         * from the database. When those are fetched, the calendar refreshes itself.
         * @param Date date startDate of the calendar
         * @param string range (week|date) range to fetch. A week or a month (date is a naming inconsistency caused by the directive)
         */
        setDate: function(date, range) {
            range = range || $rootScope.getSetting('calendar.mode');
            var endDate = new Date(date);
            var startDate = new Date(date);
            switch (range) {
                case 'week':
                    endDate.setDate(startDate.getDate() + 7);
                    startDate.setDate(startDate.getDate() - startDate.getDay() - 7);
                    break;
                case 'date': // actually: a month.
                    endDate.setDate(40);
                    startDate.setDate(-47);
                    break;
            }
            service.getEventsForDateRange(startDate, endDate);
        },
        /**
         * Optimized function to feed the calendar it's data.
         * Fetches the episodes for a date range and the relevant series for it. Then caches and refreshes the calendar
         * @param  Date start startdate
         * @param  Date end enddate
         */
        getEventsForDateRange: function(start, end) {
            // fetch episodes between 2 timestamps
            FavoritesService.getEpisodesForDateRange(start.getTime(), end.getTime()).then(function(episodes) {
                var serieIDs = {};
                // build up a key/value map of serie ids.
                episodes.map(function(episode) {
                    serieIDs[episode.get('ID_Serie')] = episode.get('ID_Serie');
                });
                // find all unique series for episodes that were returned 
                CRUD.Find('Serie', ['ID_Serie in (' + Object.keys(serieIDs).join(',') + ')']).then(function(series) {
                    var cache = {};
                    var events = [];
                    // build up a key/value map of fetched series
                    series.map(function(serie) {
                        cache[serie.getID()] = serie;
                    });
                    // iterate all the episodes and bind it together with the serie into an event array
                    episodes.map(function(episode) {
                        events.push({
                            start: new Date(episode.get('firstaired')),
                            serie: cache[episode.get('ID_Serie')].get('name'),
                            serieID: cache[episode.get('ID_Serie')].get('TVDB_ID'),
                            episodeID: episode.get('TVDB_ID'),
                            episode: episode
                        });
                    });
                    service.setEvents(events);
                    // clear used variables.
                    events = cache = serieIDs = episodes = series = null;
                });
            });
        },
        clearCache: function() {
            calendarEvents = {};
        },
        /** 
         * Merge any incoming new events with the events already in calendarEvents.
         * Adds them otherwise.
         * The calendarEvents cache is updated per day so the calendar doesn't refresh unnecessarily
         */
        setEvents: function(events) {
            events.map(function(event) {
                var date = new Date(new Date(event.start).getTime()).toDateString();

                if (!(date in calendarEvents)) {
                    calendarEvents[date] = [];
                }
                service.deleteDuplicate(event.episodeID, date);
                var existing = calendarEvents[date].filter(function(el) {
                    return el.episodeID == event.episodeID;
                });
                if (existing.length == 0) {
                    calendarEvents[date].push(event);
                }
            });
            $rootScope.$broadcast('calendar:events', events);
        },

        deleteDuplicate: function(duplicateID, eventDate) {
            for (var aDate in calendarEvents) {
                if (aDate !== eventDate) {
                    var eventList = calendarEvents[aDate];
                    for (var index = 0; index < eventList.length; index++) {
                        if (eventList[index].episodeID === duplicateID) {
                            calendarEvents[aDate].splice(index, 1);
                            return;
                        }
                    }
                }
            }
        },

        hasEvent: function(date) {
            return (new Date(date).toDateString() in calendarEvents);
        },

        getEvents: function(date) {
            var str = date instanceof Date ? date.toDateString() : new Date(date).toDateString();
            return (str in calendarEvents) ? calendarEvents[str] : [];
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

.directive('calendarEvent', function(uTorrent) {
    return {
        restrict: 'E',
        scope: {
            event: '='
        },
        templateUrl: 'templates/event.html',
        link: function($scope) {
            $scope.isTorrentClientConnected = function() {
                return uTorrent.isConnected();
            };
            $scope.$on('magnet:select:' + $scope.event.episode.get('TVDB_ID'), function(evt, magnet) {
                console.debug("Found a magnet selected!", magnet);
                $scope.event.episode.set('magnetHash', magnet);
                $scope.event.episode.Persist();
            });
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