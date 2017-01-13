DuckieTV

.constant('datePickerConfig', {
    template: 'templates/datepicker.html',
    view: 'month',
    views: ['year', 'month', 'week', 'date', 'hours', 'minutes'],
    step: 5,
    startSunday: true
})

.directive('datePicker', ["datePickerConfig", "SettingsService", "$injector", "$rootScope",
    function datePickerDirective(datePickerConfig, SettingsService, $injector, $rootScope) {
        //noinspection JSUnusedLocalSymbols
        return {
            template: '<div ng-include="template"></div>',
            scope: {
                model: '=datePicker',
                after: '=?',
                before: '=?'
            },
            link: function(scope, element, attrs) {
                function getVisibleMinutes(date, step) {
                    date = new Date(date || new Date());
                    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
                    var minutes = [];
                    var stop = date.getTime() + 60 * 60 * 1000;
                    while (date.getTime() < stop) {
                        minutes.push(date);
                        date = new Date(date.getTime() + step * 60 * 1000);
                    }
                    return minutes;
                }

                function getVisibleWeek(date, startSunday) {
                    date = new Date(date || new Date());
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    date.setMilliseconds(0);

                    var weeks = [];
                    var day = date.getDay(),
                        startSunday = startSunday ? 0 : 1;

                    if (startSunday === 1 && date.getDay() === 0) {
                        date.setDate(date.getDate() - 6);
                    } else {
                        date.setDate(date.getDate() - (date.getDay() - startSunday));
                    }

                    var week = [];

                    for (var i = 0; i < 7; i++) {
                        week.push(new Date(date));
                        date.setDate(date.getDate() + 1);
                    }
                    return [week];
                }

                function getVisibleWeeks(date, startSunday) {
                    date = new Date(date || new Date());
                    var startMonth = date.getMonth(),
                        startYear = date.getYear();
                    date.setDate(1);
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                    startSunday = startSunday ? 0 : 1;

                    if (date.getDay() === 0) {
                        date.setDate(-6 + startSunday);
                    } else {
                        date.setDate(date.getDate() - (date.getDay() - startSunday));
                    }

                    var weeks = [];
                    while (weeks.length < 6) {
                        if (date.getYear() == startYear && date.getMonth() > startMonth) break;
                        var week = [];
                        for (var i = 0; i < 7; i++) {
                            week.push(new Date(date));
                            date.setDate(date.getDate() + 1);
                            date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
                        }
                        weeks.push(week);
                    }
                    return weeks;
                }

                function getVisibleYears(date) {
                    var years = [];
                    date = new Date(date || new Date());
                    date.setFullYear(date.getFullYear() - (date.getFullYear() % 10));
                    for (var i = 0; i < 12; i++) {
                        years.push(new Date(date.getFullYear() + (i - 1), 0, 1));
                    }
                    return years;
                }

                function getDaysOfWeek(date, startSunday) {
                    date = new Date(date || new Date());
                    date = new Date(date.getFullYear(), date.getMonth(), date.getDate());

                    date.setDate(date.getDate() - (date.getDay() - (startSunday ? 0 : 1)));
                    var days = [];
                    for (var i = 0; i < 7; i++) {
                        days.push(new Date(date));
                        date.setDate(date.getDate() + 1);
                    }
                    return days;
                }

                function getVisibleMonths(date) {
                    date = new Date(date || new Date());
                    var year = date.getFullYear();
                    var months = [];
                    for (var month = 0; month < 12; month++) {
                        months.push(new Date(year, month, 1));
                    }
                    return months;
                }

                function getVisibleHours(date) {
                    date = new Date(date || new Date());
                    date.setHours(0);
                    date.setMinutes(0);
                    date.setSeconds(0);
                    date.setMilliseconds(0);
                    var hours = [];
                    for (var i = 0; i < 24; i++) {
                        hours.push(date);
                        date = new Date(date.getTime() + 60 * 60 * 1000);
                    }
                    return hours;
                }

                scope.date = new Date(scope.model || new Date());
                scope.views = datePickerConfig.views.concat();
                scope.view = attrs.view || datePickerConfig.view;
                scope.now = new Date();
                scope.template = attrs.template || datePickerConfig.template;

                var step = parseInt(attrs.step || datePickerConfig.step, 10);

                /** @namespace attrs.minView, attrs.maxView */
                scope.views = scope.views.slice(
                    scope.views.indexOf(attrs.maxView || 'year'),
                    scope.views.indexOf(attrs.minView || 'minutes') + 1
                );

                if (scope.views.length === 1 || scope.views.indexOf(scope.view) === -1) {
                    scope.view = scope.views[0];
                }

                scope.eventService = attrs.eventService || false;
                if (scope.eventService) {
                    if ($injector.has(scope.eventService)) {
                        scope.eventService = $injector.get(scope.eventService);
                    }
                }

                $rootScope.$on('calendar:setdate', function(evt, newDate) {
                    if (newDate !== undefined && scope.date.toDateString() != newDate.toDateString()) {
                        scope.date = newDate;
                        update();
                    }
                });

                scope.hasEvent = function(date) {
                    return (scope.eventService) ? scope.eventService.hasEvent(date) : false;
                };

                scope.getEvents = function(date) {
                    return (scope.eventService) ? scope.eventService.getEvents(date) : false;
                };

                scope.getTodoEvents = function() {
                    return (scope.eventService) ? scope.eventService.getTodoEvents() : false;
                };


                scope.getSeries = function(date) {
                    return (scope.eventService) ? scope.eventService.getSeries(date) : false;
                };

                scope.markDayWatched = function(day) {
                    return (scope.eventService) ? scope.eventService.markDayWatched(day, scope.$root,$injector.get('SettingsService').get('episode.watched-downloaded.pairing')) : false;
                };

                scope.markDayDownloaded = function(day) {
                    return (scope.eventService) ? scope.eventService.markDayDownloaded(day, scope.$root) : false;
                };

                var expandedSeries = {};

                scope.isExpanded = function(date, serie) {
                    var key = [new Date(date).toDateString(), '_', serie].join('');
                    return ((key in expandedSeries) && expandedSeries[key] === true);
                };

                scope.$on('expand:serie', function(event, date, serie) {
                    var key = [new Date(date).toDateString(), '_', serie].join('');
                    expandedSeries[key] = true;
                });

                scope.setView = function(nextView) {
                    if (scope.views.indexOf(nextView) !== -1) {
                        scope.view = nextView;
                    }
                };

                scope.setDate = function(date) {
                    scope.date = date;
                    // change next view
                    var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
                    if (!nextView || scope.model) {
                        scope.model = new Date(scope.model || date);

                        //noinspection FallThroughInSwitchStatementJS
                        switch (scope.view) {
                            case 'minutes':
                                scope.model.setMinutes(date.getMinutes());
                                /*falls through*/
                            case 'hours':
                                scope.model.setHours(date.getHours());
                                /*falls through*/
                            case 'week':
                            case 'date':
                                scope.model.setDate(date.getDate());
                                /*falls through*/
                            case 'month':
                                scope.model.setMonth(date.getMonth());
                                /*falls through*/
                            case 'year':
                                scope.model.setFullYear(date.getFullYear());
                        }
                        scope.$emit('setDate', scope.model, scope.view);
                    } else if (nextView) {
                        if (nextView == 'week' && scope.view == 'month') {
                            nextView = 'date';
                        }
                        scope.setView(nextView);
                    }
                };

                function update() {
                    var view = scope.view;
                    var date = scope.date;
                    switch (view) {
                        case 'year':
                            scope.years = getVisibleYears(date);
                            break;
                        case 'month':
                            scope.months = getVisibleMonths(date);
                            break;
                        case 'week':
                            scope.weekdays = scope.weekdays || getDaysOfWeek(undefined, datePickerConfig.startSunday);
                            scope.weeks = getVisibleWeek(date, datePickerConfig.startSunday);
                            if (scope.eventService) {
                                scope.eventService.setVisibleDays(scope.weeks);
                            }
                            break;
                        case 'date':
                            scope.weekdays = scope.weekdays || getDaysOfWeek(undefined, datePickerConfig.startSunday);
                            scope.weeks = getVisibleWeeks(date, datePickerConfig.startSunday);
                            if (scope.eventService) {
                                scope.eventService.setVisibleDays(scope.weeks);
                            }
                            break;
                        case 'hours':
                            scope.hours = getVisibleHours(date);
                            break;
                        case 'minutes':
                            scope.minutes = getVisibleMinutes(date, step);
                            break;
                    }
                    scope.$emit('setDate', scope.date, scope.view);
                }

                function watch() {
                    if (scope.view !== 'date') {
                        return scope.view;
                    }
                    return scope.model ? scope.model.getMonth() : null;
                }

                scope.$watch(watch, update);

                scope.next = function(delta) {
                    var date = scope.date;
                    delta = delta || 1;
                    switch (scope.view) {
                        case 'year':
                            /*falls through*/
                        case 'month':
                            date.setFullYear(date.getFullYear() + delta);
                            break;
                        case 'week':
                            date.setDate(date.getDate() + (7 * delta));
                            break;
                        case 'date':
                            date.setMonth(date.getMonth() + delta);
                            break;
                        case 'hours':
                            /*falls through*/
                        case 'minutes':
                            date.setHours(date.getHours() + delta);
                            break;
                    }
                    update();
                };

                scope.prev = function(delta) {
                    return scope.next(-delta || -1);
                };

                scope.isAfter = function(date) {
                    return scope.after ? scope.after.getTime() <= date.getTime() : false;
                };

                scope.isBefore = function(date) {
                    return scope.before ? scope.before.getTime() >= date.getTime() : false;
                };

                scope.isSameMonth = function(date) {
                    return scope.isSameYear(date) && scope.model.getMonth() === date.getMonth();
                };

                scope.isSameYear = function(date) {
                    return (scope.model ? scope.model.getFullYear() === date.getFullYear() : false);
                };

                scope.isSameDay = function(date) {
                    return scope.isSameMonth(date) && scope.model.getDate() === date.getDate();
                };

                scope.isSameHour = function(date) {
                    return scope.isSameDay(date) && scope.model.getHours() === date.getHours();
                };

                scope.isSameMinutes = function(date) {
                    return scope.isSameHour(date) && scope.model.getMinutes() === date.getMinutes();
                };

                scope.isNow = function(date) {
                    var is = true;
                    var now = scope.now;
                    //noinspection FallThroughInSwitchStatementJS
                    switch (scope.view) {
                        case 'minutes':
                            is &= ~~(date.getMinutes() / step) === ~~(now.getMinutes() / step);
                            /*falls through*/
                        case 'hours':
                            is &= date.getHours() === now.getHours();
                            /*falls through*/
                        case 'date':
                        case 'week':
                            is &= date.getDate() === now.getDate();
                            /*falls through*/
                        case 'month':
                            is &= date.getMonth() === now.getMonth();
                            /*falls through*/
                        case 'year':
                            is &= date.getFullYear() === now.getFullYear();
                    }
                    return is;
                };
            }
        };
    }
]);
