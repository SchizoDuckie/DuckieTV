angular.module('DuckieTV.directives.calendar', ['DuckieTV.providers.favorites'])

/**
 * The CalendarEvents service provides storage and retrieve functions
 * for episodes that are displayed on the calendar. It has built-in cache
 * and watches for the calendar changing it's date before fetching a new
 * set of episodes from the database
 */ 
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
         * Removes any mention of the episode that already exists and then adds the new one.
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
                } else {
                	var index = calendarEvents[date].indexOf(existing[0]);
                	calendarEvents[date][index].episode = event.episode;
                }
            });
            $rootScope.$broadcast('calendar:events', events);
        },

        /** 
         * If the episode exist in the calendarEvents object, remove it.
         */
        deleteDuplicate: function(duplicateID, eventDate) {
            for (var aDate in calendarEvents) {
                if (aDate !== eventDate) {
                    var eventList = calendarEvents[aDate];
                    for (var index = 0; index < eventList.length; index++) {
                        if (eventList[index].episodeID === duplicateID) {
                        	console.log('removing existing event!', eventList[index]);
                            calendarEvents[aDate].splice(index, 1);
                            return;
                        }
                    }
                }
            }
        },

        /**
         * Check if an event exists at the given date
         */
        hasEvent: function(date) {
            return (new Date(date).toDateString() in calendarEvents);
        },

        /**
         * Return events for a date or an empty array
         */
        getEvents: function(date) {
            var str = date instanceof Date ? date.toDateString() : new Date(date).toDateString();
            return (str in calendarEvents) ? calendarEvents[str] : [];
        }
    };

    $rootScope.$on('episode:marked:watched', function(event, data) {
        service.setEvents([{ 
        	episodeID: data.get('TVDB_ID'), 
        	episode: data.asObject() 
        }]);       
    });

    $rootScope.$on('episode:marked:notwatched', function(event, data) {
        service.setEvents([{ 
        	episodeID: data.get('TVDB_ID'), 
        	episode: data.asObject() 
        }]);       
    });

     /**
      * Refresh the active calendar by re-fetching all data.
      */
    $rootScope.$on('episodes:updated', function(event) {
        service.setDate(new Date());
    });
    /**
     * Reset the calendarEvents object so that any cache is flushed
     */
    $rootScope.$on('calendar:clearcache', function() {
        service.clearCache();
    });

    /**
     * When the calendar broadcasts a setDate event, fetch new data for that range.
     */
    $rootScope.$on('setDate', function(evt, date, range) {
        service.setDate(date, range);
    });
    return service;
})

/**
 * The <calendar-event> directive displays an episode on the calendar
 * This also watches for the magnet:select event will be fired by the
 * TorrentDialog when a user selects a magnet link for an episode.
 */
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

/**
 * The <calendar> directive is just a little wrapper around the 3rd party datePicker directive
 * that provides the calendar basics.
 * 
 * It sets up the defaults and initializes the calendar.
 */
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