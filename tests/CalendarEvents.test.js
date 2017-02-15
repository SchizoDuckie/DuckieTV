describe('CalendarEvents', function() {

    var CalendarEvents, $rootScope, $scope;



    beforeEach(inject(function(_CalendarEvents_) {
        CalendarEvents = _CalendarEvents_;
        CalendarEvents.setVisibleDays([
            [
                new Date("Sun Jan 39 2017"),
                new Date("2017-01-30"),
                new Date("2017-01-31"),
                new Date("2017-02-01"),
                new Date("2017-02-02T23:00:00.000Z"),
                new Date("2017-02-03T23:00:00.000Z"),
                new Date("2017-02-04T23:00:00.000Z")
            ],
            [
                new Date("2017-02-05T23:00:00.000Z"),
                new Date("2017-02-06T23:00:00.000Z"),
                new Date("2017-02-07T23:00:00.000Z"),
                new Date("2017-02-08T23:00:00.000Z"),
                new Date("2017-02-09T23:00:00.000Z"),
                new Date("2017-02-10T23:00:00.000Z"),
                new Date("2017-02-11T23:00:00.000Z")
            ],
            [
                new Date("2017-02-12T23:00:00.000Z"),
                new Date("2017-02-13T23:00:00.000Z"),
                new Date("2017-02-14T23:00:00.000Z"),
                new Date("2017-02-15T23:00:00.000Z"),
                new Date("2017-02-16T23:00:00.000Z"),
                new Date("2017-02-17T23:00:00.000Z"),
                new Date("2017-02-18T23:00:00.000Z")
            ],
            [
                new Date("2017-02-19T23:00:00.000Z"),
                new Date("2017-02-20T23:00:00.000Z"),
                new Date("2017-02-21T23:00:00.000Z"),
                new Date("2017-02-22T23:00:00.000Z"),
                new Date("2017-02-23T23:00:00.000Z"),
                new Date("2017-02-24T23:00:00.000Z"),
                new Date("2017-02-25T23:00:00.000Z")
            ],
            [
                new Date("2017-02-26T23:00:00.000Z"),
                new Date("2017-02-27T23:00:00.000Z"),
                new Date("2017-02-28T23:00:00.000Z"),
                new Date("2017-03-01T23:00:00.000Z"),
                new Date("2017-03-02T23:00:00.000Z"),
                new Date("2017-03-03T23:00:00.000Z"),
                new Date("2017-03-04T23:00:00.000Z")
            ]
        ]);
    }));

    it('should be instantiated', function() {

        expect(angular.isObject(CalendarEvents)).toBe(true);
    });

    it('should be able to load calendar events', function() {

        var events = fixture('calendarevents');


        Object.keys(events).map(function(date) {
            console.log(events[date]);
            events[date].map(function(value, key) {
                console.log("epi:", key)
                console.log(value.episode);
                events[date][key].serie = CRUD.fromCache(Serie, value.serie);
                value.episode.images = "{}";
                events[date][key].episode = CRUD.fromCache(Episode, value.episode);
                events[date][key].start = new Date(value.episode.firstaired);
            });
            console.log(events[date]);
            return;
            CalendarEvents.setEvents(events[date]);

        });

        console.log(CalendarEvents.getEvents("Mon Jan 30 2017"));
        expect(CalendarEvents.getEvents("Mon Jan 30 2017").length == 3).toBe(true);
    })



});