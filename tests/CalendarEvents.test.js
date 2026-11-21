describe('CalendarEvents', function() {

    var CalendarEvents, FavoritesService, SettingsService, rootScope, $scope;

    beforeEach(module('DuckieTV'));

    function loadFixtures() {
        var events = fixture('calendarevents');

        Object.keys(events).map(function(date) {
            events[date].map(function(value, key) {
                FavoritesService.favoriteIDs.push(value.serie.TRAKT_ID.toString());
                events[date][key].serie = CRUD.fromCache(Serie, value.serie);
                events[date][key].episode = CRUD.fromCache(Episode, value.episode);
            });
        });
        return events;
    }

    function loadUpdateFixtures() {
        var events = fixture('calendarupdate');

        events.serie = CRUD.fromCache(Serie, events.serie);
        FavoritesService.favoriteIDs.push(events.serie.TRAKT_ID.toString());

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
                new Date("Sun Jan 29 2017"),
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

    it('queries through the end of the last local calendar day on a clock change', function() {
        spyOn(CalendarEvents, 'getEventsForDateRange');
        // Sydney ends daylight saving on April 5 and starts it on October 4 in 2026.
        [new Date(2026, 3, 5), new Date(2026, 9, 4)].forEach(function(sunday) {
            var saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() - 1);
            CalendarEvents.setVisibleDays([[saturday, sunday]]);
            var end = CalendarEvents.getEventsForDateRange.calls.mostRecent().args[1];
            expect(end.getTime()).toBe(new Date(2026, sunday.getMonth(), sunday.getDate(), 23, 59, 59, 999).getTime());
        });
    });

    it('ignores an earlier range query that finishes after navigation', inject(function($q) {
        var oldQuery = $q.defer();
        var currentQuery = $q.defer();
        spyOn(FavoritesService, 'getEpisodesForDateRange').and.returnValues(oldQuery.promise, currentQuery.promise);
        spyOn(CalendarEvents, 'setEvents');
        CalendarEvents.setVisibleDays([[new Date(2026, 1, 1), new Date(2026, 1, 2)]]);
        CalendarEvents.setVisibleDays([[new Date(2026, 1, 2), new Date(2026, 1, 3)]]);
        currentQuery.resolve([]);
        rootScope.$digest();
        oldQuery.resolve([]);
        rootScope.$digest();
        expect(CalendarEvents.setEvents.calls.count()).toBe(1);
    }));

    it('keeps local favorites without a Trakt ID and skips orphaned episodes', function() {
        var date = 'Tue Jan 31 2017';
        var local = { ID_Serie: 900000, TRAKT_ID: null };
        var event = { start: new Date(date), serie: local, ID_Serie: local.ID_Serie,
            episode: { getID: function() { return 990000; }, seasonnumber: 1 } };
        FavoritesService.favorites.push(local);
        var orphan = { start: event.start, serie: undefined,
            episode: { getID: function() { return 990001; }, seasonnumber: 1 } };
        CalendarEvents.setEvents([event, orphan]);
        expect(CalendarEvents.getEvents(date)).not.toContain(orphan);
        CalendarEvents.removeDeleted();
        expect(CalendarEvents.getEvents(date)).toContain(event);
        expect(CalendarEvents.getEvents(date).every(function(item) { return !!item.serie; })).toBe(true);

        FavoritesService.favorites.pop();
        CalendarEvents.removeDeleted();
        expect(CalendarEvents.getEvents(date)).not.toContain(event);
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

    it('derives multi-episode series groups from the canonical day events', function() {
        var date = 'Tue Jan 31 2017';
        var events = CalendarEvents.getEvents(date);
        var grouped = CalendarEvents.getSeries(date);
        var flattened = [].concat.apply([], grouped);

        expect(flattened.length).toBe(events.length);
        expect(flattened.map(function(event) { return event.episode.getID(); }).sort()).toEqual(
            events.map(function(event) { return event.episode.getID(); }).sort()
        );
    });

    it('moves an episode between dates and invalidates both grouped views', function() {
        var oldDate = 'Mon Jan 30 2017';
        var newDate = 'Tue Jan 31 2017';
        var event = CalendarEvents.getEvents(oldDate)[0];
        var episodeID = event.episode.getID();
        CalendarEvents.getSeries(oldDate);
        CalendarEvents.getSeries(newDate);
        event.start = new Date('2017-01-31T12:00:00Z');
        event.episode.firstaired = event.start.getTime();
        event.episode.firstaired_iso = event.start.toISOString();

        CalendarEvents.setEvents([event]);

        expect(CalendarEvents.getEvents(oldDate).some(function(item) { return item.episode.getID() === episodeID; })).toBe(false);
        expect(CalendarEvents.getEvents(newDate).some(function(item) { return item.episode.getID() === episodeID; })).toBe(true);
        expect([].concat.apply([], CalendarEvents.getSeries(oldDate)).some(function(item) { return item.episode.getID() === episodeID; })).toBe(false);
        expect([].concat.apply([], CalendarEvents.getSeries(newDate)).some(function(item) { return item.episode.getID() === episodeID; })).toBe(true);
    });

    it('removes deleted favorites from events and derived groups together', function() {
        var date = 'Tue Jan 31 2017';
        var removedTraktID = CalendarEvents.getEvents(date)[0].serie.TRAKT_ID.toString();
        CalendarEvents.getSeries(date);
        FavoritesService.favoriteIDs = FavoritesService.favoriteIDs.filter(function(id) {
            return id.toString() !== removedTraktID;
        });

        CalendarEvents.removeDeleted();

        expect(CalendarEvents.getEvents(date).some(function(event) { return event.serie.TRAKT_ID.toString() === removedTraktID; })).toBe(false);
        expect([].concat.apply([], CalendarEvents.getSeries(date)).some(function(event) { return event.serie.TRAKT_ID.toString() === removedTraktID; })).toBe(false);
    });


});
