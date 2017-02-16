describe('CalendarEvents', function() {

    var CalendarEvents, FavoritesService, SettingsService, rootScope, $scope;

    function loadFixtures() {
        var events = fixture('calendarevents');

        Object.keys(events).map(function(date) {
            events[date].map(function(value, key) {
                FavoritesService.favoriteIDs.push(value.serie.TVDB_ID.toString());
                events[date][key].serie = CRUD.fromCache(Serie, value.serie);
                events[date][key].episode = CRUD.fromCache(Episode, value.episode);
            });
        });
        return events;
    }

    function loadUpdateFixtures() {
        var events = fixture('calendarupdate');

        events.serie = CRUD.fromCache(Serie, events.serie);
        FavoritesService.favoriteIDs.push(events.serie.TVDB_ID.toString());

        Object.keys(events.episodes).map(function(id) {
            events.episodes[id] = CRUD.fromCache(Episode, events.episodes[id]);
        });
        return events;
    }

    beforeEach(inject(function(_CalendarEvents_, _FavoritesService_, _SettingsService_, $rootScope) {

        CalendarEvents = _CalendarEvents_;
        FavoritesService = _FavoritesService_;
        SettingsService = _SettingsService_;
        rootScope = $rootScope;
        CalendarEvents.setVisibleDays([
            [
                new Date("Sun Jan 39 2017"),
                new Date("2017-01-30"),
                new Date("2017-01-31"),
                new Date("2017-02-01"),
                new Date("2017-02-02"),
                new Date("2017-02-03"),
                new Date("2017-02-04")
            ],
            [
                new Date("2017-02-05"),
                new Date("2017-02-06"),
                new Date("2017-02-07"),
                new Date("2017-02-08"),
                new Date("2017-02-09"),
                new Date("2017-02-10"),
                new Date("2017-02-11")
            ],
            [
                new Date("2017-02-12"),
                new Date("2017-02-13"),
                new Date("2017-02-14"),
                new Date("2017-02-15"),
                new Date("2017-02-16"),
                new Date("2017-02-17"),
                new Date("2017-02-18")
            ],
            [
                new Date("2017-02-19"),
                new Date("2017-02-20"),
                new Date("2017-02-21"),
                new Date("2017-02-22"),
                new Date("2017-02-23"),
                new Date("2017-02-24"),
                new Date("2017-02-25")
            ],
            [
                new Date("2017-02-26"),
                new Date("2017-02-27"),
                new Date("2017-02-28"),
                new Date("2017-03-01"),
                new Date("2017-03-02"),
                new Date("2017-03-03"),
                new Date("2017-03-04")
            ]
        ]);

        /**
         * Import fixtures from JSON file, wake up objects and dates.
         * feed the unique favorite id's to FavoritesService
         * FavoritesService.favoriteIds keeps track of the individual TRAKT_ID's in the db
         * so that the cleaner function can remove episodes for shows that no longer exist immediately
         * (For instance, while DELETE queries are still running)
         */

        // call setEvents for each date array 
        var fixtures = loadFixtures();
        Object.keys(fixtures).map(function(date) {
            CalendarEvents.setEvents(fixtures[date]);
        });
    }));

    it('should be instantiated', function() {
        expect(angular.isObject(CalendarEvents)).toBe(true);
    });

    it('should have getEvents and setEvents functions', function() {
        expect(typeof CalendarEvents.getEvents).toBe("function");
        expect(typeof CalendarEvents.setEvents).toBe("function");
    });

    it('should be able to load calendar events', function() {
        expect(CalendarEvents.getEvents("Tue Jan 31 2017").length).toBe(4);
    });

    it('should have added all 131 events', function() {
        var events = CalendarEvents.getAllEvents();

        expect(Object.keys(events).reduce(function(acc, val) {
            return acc + events[val].length;
        }, 0)).toBe(131);
    });

    it('should be able to overwrite existing events', function() {

        var fixtures = loadFixtures()["Tue Jan 31 2017"];
        CalendarEvents.setEvents(fixtures);

        expect(CalendarEvents.getEvents("Tue Jan 31 2017").length).toBe(4);
    });

    it('should be able to handle modified events', function() {

        var fixtures = loadFixtures()["Mon Jan 30 2017"];
        fixtures[0].episode.firstaired += 60 * 60 * 3 * 1000;
        fixtures[0].episode.TVDB_ID = 5914838;
        fixtures[0].episode.episodename = "Under too much Siege";
        fixtures[0].episode.episodenumber = 15;
        fixtures[0].episode.seasonnumber = 9;
        fixtures[0].episode.firstaired = 1485749000000;
        fixtures[0].episode.firstaired_iso = "2017-01-30T01:00:00.000Z";
        fixtures[0].episode.IMDB_ID = "tt6405917";
        fixtures[0].episode.language = 'en';
        fixtures[0].episode.rating = 95;
        fixtures[0].episode.ratingcount = 4;
        fixtures[0].episode.watched = 1;
        fixtures[0].episode.watchedAt = null;
        fixtures[0].episode.downloaded = 1;
        fixtures[0].episode.magnetHash = null;
        fixtures[0].episode.TRAKT_ID = 2461468;
        fixtures[0].episode.leaked = 1;

        CalendarEvents.setEvents(fixtures);
        expect(CalendarEvents.getEvents("Mon Jan 30 2017").length).toBe(3);
    });

    it('should be able to update events via processEpisodes', function() {
        var fixtures = loadUpdateFixtures();
        CalendarEvents.processEpisodes(fixtures.serie, fixtures.episodes);
        expect(CalendarEvents.getEvents("Tue Jan 31 2017").length).toBe(4);

    });

    it('should be able to run removeDeleted at any time and not modify the episode count if nothing changed', function() {

        spyOn(CalendarEvents, 'removeDeleted').and.callThrough();

        var fixtures = loadFixtures()["Tue Jan 31 2017"];
        CalendarEvents.setEvents(fixtures);
        expect(CalendarEvents.removeDeleted).toHaveBeenCalled();
        expect(CalendarEvents.getEvents("Tue Jan 31 2017").length).toBe(4);
        rootScope.$broadcast('storage:update');
        expect(CalendarEvents.getEvents("Tue Jan 31 2017").length).toBe(4);
        expect(CalendarEvents.removeDeleted).toHaveBeenCalled();
    });

    it('should be able to run removeDeleted when the TVDB_IDs in FavoritesService.favoriteIDs are strings instead of ints', function() {

        spyOn(CalendarEvents, 'removeDeleted').and.callThrough();

        var fixtures = loadFixtures()["Mon Jan 30 2017"];

        FavoritesService.favoriteIDs.map(function(value, key) {
            FavoritesService.favoriteIDs[key] = value.toString();
        });

        CalendarEvents.setEvents(fixtures);

        rootScope.$broadcast('storage:update');
        expect(CalendarEvents.getEvents("Mon Jan 30 2017").length).toBe(3);
        expect(CalendarEvents.removeDeleted).toHaveBeenCalled();
    });


});