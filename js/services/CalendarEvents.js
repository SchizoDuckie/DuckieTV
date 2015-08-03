/**
 * The CalendarEvents service provides storage and retrieve functions
 * for episodes that are displayed on the calendar. It has built-in cache
 * and watches for the calendar changing it's date before fetching a new
 * set of episodes from the database
 */
DuckieTV.factory('CalendarEvents', ["$rootScope", "FavoritesService", "SettingsService",
    function($rootScope, FavoritesService, SettingsService) {

        var calendarEvents = {};
        var seriesForDate = {};
        var expandedSeries = {};
        var calendarEpisodeSortCache = {};
        var calendarStartDate = null;
        var calendarEndDate = null;

        /**
         * Check if an episode already exists on a date in the calendar.
         */
        function hasEvent(date, event) {
            return calendarEvents[date].filter(function(el) {
                return el.episode.getID() == event.episode.getID();
            }).length == 1;
        }

        /**
         * Add an event to the calendar if it's not already there.
         */
        function addEvent(date, event) {
            if (!hasEvent(date, event)) {
                calendarEvents[date].push(event);
                calendarEvents[date].sort(calendarEpisodeSort);
                if (!(event.ID_Serie in seriesForDate[date])) {
                    seriesForDate[date][event.ID_Serie] = [];
                }
                seriesForDate[date][event.ID_Serie].push(event);
                delete calendarEpisodeSortCache[date];
            }
        }

        /**
         * Sort the episodes for a specific date.
         * First by air time, then by episode number if multiple episodes for a serie,
         * then by title if multiple series at the same time.
         */
        function calendarEpisodeSort(a, b) {
            var ad = new Date(a.episode.firstaired_iso).getTime();
            var bd = new Date(b.episode.firstaired_iso).getTime()
            if (ad < bd) return -1;
            else if (ad > bd) return 1;
            else {
                // air at the same time, now order by title first and if the names match by episode
                if (a.ID_Serie == b.ID_Serie) {
                    if (a.episode.episodenumber < b.episode.episodenumber) return -1;
                    if (a.episode.episodenumber > b.episode.episodenumber) return 1;

                } else {
                    return a.serie.title > b.serie.title;
                }
            }
        }

        /** 
         * If the episode exist in other dates in the calendarEvents object, remove it.
         */
        function deleteDuplicates(duplicateID, eventDate) {
            for (var aDate in calendarEvents) {
                if (aDate !== eventDate) {
                    var eventList = calendarEvents[aDate];
                    for (var index = eventList.length - 1; index > -1; index--) {
                        if (eventList[index].episodeID === duplicateID) {
                            calendarEvents[aDate].splice(index, 1);
                            delete seriesForDate[aDate][eventList[index].TVDB_ID];
                            return;
                        }
                    }
                }
            }
        }

        /** 
         * Remove shows that were deleted from the database from the calendar.
         */
        function removeDeleted() {
            Object.keys(calendarEvents).map(function(date) {
                var eventList = calendarEvents[date];
                for (var index = eventList.length - 1; index > -1; index--) {
                    if (FavoritesService.favoriteIDs.indexOf(eventList[index].TVDB_ID) == -1) {
                        calendarEvents[date].splice(index, 1);
                    }
                }
            });
        }

        var service = {
            /**
             * setVisibleDays function is called from the calendar directive.
             * It fills the CalendarEvents with days that are currently on display and makes sure
             * that days that are not currently displayed are purged from cache
             */
            setVisibleDays: function(range) {
                if (!range || range.length == 1 && range[0].length == 1) return;
                var dates = [];
                calendarStartDate = new Date(range[0][0]);
                calendarEndDate = new Date((range[range.length - 1][range[range.length - 1].length - 1].getTime()) + 86399999); // add 23:59:59 to endDate
                calendarEvents = {};
                seriesForDate = {};
                expandedSeries = {};
                range.map(function(week) {
                    week.map(function(day) {
                        day = new Date(day).toDateString();
                        dates.push(day);
                        if (!(day in calendarEvents)) {
                            calendarEvents[day] = [];
                            seriesForDate[day] = {};
                        }
                    })
                });
                Object.keys(calendarEvents).map(function(day) {
                    if (dates.indexOf(day) == -1) {
                        //console.debug("Cleaning up day: ", day);
                        delete calendarEvents[day];
                        delete seriesForDate[day];
                    }
                });
                service.getEventsForDateRange(calendarStartDate, calendarEndDate);
            },

            /**
             * Optimized function to feed the calendar it's data.
             * Fetches the episodes for a date range and the relevant series for it. Then caches and refreshes the calendar
             * @param  Date start startDate
             * @param  Date end endDate
             */
            getEventsForDateRange: function(start, end) {
                // fetch episodes between 2 timestamps
                return FavoritesService.getEpisodesForDateRange(start.getTime(), end.getTime()).then(function(episodes) {
                    // iterate all the episodes and bind it together with the serie into an event array
                    return service.setEvents(episodes.map(function(episode) {
                        return {
                            start: new Date(episode.firstaired),
                            ID_Serie: episode.ID_Serie,
                            serie: FavoritesService.getByID_Serie(episode.ID_Serie),
                            episode: episode
                        };
                    }));
                });
            },
            clearCache: function() {
                calendarStartDate = null;
                calendarEndDate = null;
                calendarEvents = {};
            },

            /** 
             * Merge any incoming new events with the events already in calendarEvents.
             * Removes any mention of the episode that already exists and then adds the new one.
             * The calendarEvents cache is updated per day so the calendar doesn't refresh unnecessarily
             */
            setEvents: function(events) {
                removeDeleted();
                events.map(function(event) {
                    var date = new Date(new Date(event.start).getTime()).toDateString();
                    if (!(date in calendarEvents)) return;
                    deleteDuplicates(event.episode.getID(), date);
                    addEvent(date, event);
                });
                $rootScope.$applyAsync();
            },

            processEpisodes: function(serie, seasons) {
                //console.debug("Process episodes ", serie.name, seasons);
                var filtered = [];
                seasons.map(function(episodes) {
                    Object.keys(episodes).map(function(id) {
                        var date = new Date(new Date(episodes[id].firstaired).getTime()).toDateString();
                        //console.debug("matching date: ", date, calendarEvents[date]);
                        if (!(date in calendarEvents)) return;

                        addEvent(date, {
                            start: new Date(episodes[id].firstaired),
                            ID_Serie: episodes[id].ID_Serie,
                            serie: serie,
                            episode: episodes[id]
                        });
                    });
                });
                $rootScope.$applyAsync();
            },
            /**
             * Check if an event exists at the given date
             */
            hasEvent: function(date) {
                return (new Date(date).toDateString() in calendarEvents);
            },

            markDayWatched: function(day, rootScope) {
                var str = day instanceof Date ? day.toDateString() : new Date(day).toDateString();
                if (str in calendarEvents) {
                    calendarEvents[str].map(function(calEvent) {
                        if (calEvent.episode.hasAired()) {
                            calEvent.episode.markWatched(rootScope);
                            //console.debug("Mark calendar eventwatched: ", calEvent);
                        }
                    })
                }
            },
            /**
             * Return events for a date or an empty array
             */
            getEvents: function(date) {
                var str = date instanceof Date ? date.toDateString() : new Date(date).toDateString();
                return (str in calendarEvents) ? calendarEvents[str] : [];
            },
            /**
             * Sort the series for a day, that are now grouped by ID_Serie. It needs to return
             * an array (so that it can be sorted) instead of an object, and cache it, for angular.
             * Cache is cleared and regenerated when an episode is added to the list.
             */
            getSeries: function(date) {
                var str = date instanceof Date ? date.toDateString() : new Date(date).toDateString();
                if (!(str in calendarEpisodeSortCache)) { // no cache yet?
                    var seriesForDay = seriesForDate[str] || {};
                    calendarEpisodeSortCache[str] = Object.keys(seriesForDay).map(function(serieId) { // turn the object into an array
                        return seriesForDay[serieId];
                    }).sort(function(a, b) {
                        return calendarEpisodeSort(a[0], b[0]); // and sort it by the first item in it.
                    });
                }
                return calendarEpisodeSortCache[str];
            }
        };

        return service;
    }
])