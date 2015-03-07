/**
 * The CalendarEvents service provides storage and retrieve functions
 * for episodes that are displayed on the calendar. It has built-in cache
 * and watches for the calendar changing it's date before fetching a new
 * set of episodes from the database
 */
DuckieTV.factory('CalendarEvents', ["$rootScope", "FavoritesService", "SettingsService",
    function($rootScope, FavoritesService, SettingsService) {

        var calendarEvents = {};
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
                calendarEndDate = new Date(range[range.length - 1][range[range.length - 1].length - 1]);

                range.map(function(week) {
                    week.map(function(day) {
                        day = new Date(day).toDateString();
                        dates.push(day);
                        if (!(day in calendarEvents)) {
                            calendarEvents[day] = [];
                        }
                    })
                });
                Object.keys(calendarEvents).map(function(day) {
                    if (dates.indexOf(day) == -1) {
                        delete calendarEvents[day];
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
                console.log("Process episodes ", serie.name, seasons);
                var filtered = [];
                seasons.map(function(episodes) {
                    Object.keys(episodes).map(function(id) {
                        var date = new Date(new Date(episodes[id].firstaired).getTime()).toDateString();
                        //console.log("matching date: ", date, calendarEvents[date]);
                        if (!(date in calendarEvents)) return;

                        addEvent(date, {
                            start: new Date(episodes[id].firstaired),
                            serie: serie,
                            episode: episodes[id]
                        });
                    })
                });
                $rootScope.$applyAsync();
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

        return service;
    }
])

/**
 * The <calendar-event> directive displays an episode on the calendar
 * This also watches for the magnet:select event will be fired by the
 * TorrentDialog when a user selects a magnet link for an episode.
 */
.directive('calendarEvent', ["uTorrent", "SceneNameResolver", "EpisodeAiredService", "SettingsService",
    function(uTorrent, SceneNameResolver, EpisodeAiredService, SettingsService, $location) {
        return {
            restrict: 'E',
            scope: {
                serie: '=',
                episode: '='
            },
            templateUrl: 'templates/event.html',
            controller: function($scope, $rootScope, $location) {

                $scope.getSetting = SettingsService.get;
                $scope.hoverTimer = null;
                var cachedSearchString = false;

                /**
                 * Auto-switch background image to a relevant one for the calendar item when
                 * hovering over an item for 1.5s
                 * @return {[type]} [description]
                 */
                $scope.startHoverTimer = function() {
                    $scope.clearHoverTimer();
                    // Make sure serie has fanart defined
                    if ($scope.serie.fanart) {
                        var background = $scope.serie.fanart;
                        $scope.hoverTimer = setTimeout(function() {
                            $scope.$root.$broadcast('background:load', background);
                        }.bind(this), 1500);
                    };
                };

                $scope.clearHoverTimer = function() {
                    clearTimeout($scope.hoverTimer);
                };

                $scope.isTorrentClientConnected = function() {
                    return uTorrent.isConnected();
                };

                $scope.selectEpisode = function(serie, episode) {
                    $location.path('/serie/' + serie.TVDB_ID + '/season/' + episode.seasonnumber + '?episode=' + episode.TVDB_ID);
                }

            }
        };
    }
])

/**
 * The <calendar> directive is just a little wrapper around the 3rd party datePicker directive
 * that provides the calendar basics.
 *
 * It sets up the defaults and initializes the calendar.
 */
.directive('calendar', function() {
    return {
        restrict: 'E',
        template: function(element, attrs) {
            return '<div date-picker ' +
                (attrs.eventService ? 'event-service="' + attrs.eventService + '"' : '') +
                (attrs.view ? 'view="' + attrs.view + '" ' : 'view="week"') +
                (attrs.template ? 'template="' + attrs.template + '" ' : '') +
                'min-view="' + (attrs.minView || 'date') + '"' + '></div>';
        },
        link: function($scope, iElement) {
            $scope.views = ['year', 'month', 'week', 'date'];
            $scope.view = 'week';

            var calendar = iElement[0].querySelector('div[date-picker]');

            $scope.zoom = function(spaceToTheRight) {
                var cw = document.body.clientWidth;
                var avail = cw - spaceToTheRight;
                var zoom = avail / cw;
                calendar.style.transform = 'scale(' + zoom + ')';
            }
        },
        controller: function($scope, SidePanelState) {
            var calendar = this;
            this.isShowing = false;
            this.isExpanded = false;
            Object.observe(SidePanelState.state, function(newValue) {
                if (newValue[0].object.isExpanded) {
                    calendar.isExpanded = true;
                    $scope.zoom(840);
                } else if (newValue[0].object.isShowing) {
                    calendar.isShowing = true;
                    $scope.zoom(450);
                } else {
                    calendar.isExpanded = calendar.isShowing = false;

                    $scope.zoom(0);
                }
                $scope.$applyAsync();
            });

            window.addEventListener('resize', function() {
                if (calendar.isExpanded) {
                    $scope.zoom(840);
                } else if (calendar.isShowing) {
                    $scope.zoom(450);
                }
                $scope.$applyAsync();
            });
        }
    };
});