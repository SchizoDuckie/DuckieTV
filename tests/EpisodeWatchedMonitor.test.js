describe('watchedCounter coalescing worker', function() {
    var $q;
    var $rootScope;
    var watchedCounter;
    var queryDeferred;
    var season;
    var serie;

    beforeEach(module('DuckieTV', function($provide) {
        serie = {
            Persist: jasmine.createSpy('serie.Persist')
        };
        $provide.value('FavoritesService', {
            getByID_Serie: function() { return serie; },
            favorites: []
        });
    }));

    beforeEach(inject(function(_$q_, _$rootScope_, _watchedCounter_) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        watchedCounter = _watchedCounter_;
        queryDeferred = $q.defer();
        season = {
            Persist: jasmine.createSpy('season.Persist').and.returnValue($q.when())
        };
        serie.Persist.and.returnValue($q.when());
        spyOn(CRUD, 'executeQuery').and.returnValue(queryDeferred.promise);
        spyOn(CRUD, 'FindOne').and.returnValue($q.when(season));
        CRUD.stats.writesExecuted = CRUD.stats.writesQueued;
    }));

    function counts() {
        return { rows: [{ ID_Season: 10, watched: 0, amount: 2 }] };
    }

    it('coalesces repeated in-flight IDs into one final pass', function() {
        var secondQuery = $q.defer();
        CRUD.executeQuery.and.returnValues(queryDeferred.promise, secondQuery.promise);
        var first = watchedCounter.recountSerie(1);
        var second = watchedCounter.recountSerie(1);
        var third = watchedCounter.recountSerie(1);
        expect(second).toBe(first);
        expect(third).toBe(first);

        queryDeferred.resolve(counts());
        $rootScope.$digest();

        expect(CRUD.executeQuery.calls.count()).toBe(2);
        secondQuery.resolve(counts());
        $rootScope.$digest();
    });

    it('processes distinct IDs serially with one worker', function() {
        var secondQuery = $q.defer();
        CRUD.executeQuery.and.returnValues(queryDeferred.promise, secondQuery.promise);

        watchedCounter.recountSerie(1);
        watchedCounter.recountSerie(2);
        queryDeferred.resolve(counts());
        $rootScope.$digest();

        expect(CRUD.executeQuery.calls.count()).toBe(2);
        secondQuery.resolve(counts());
        $rootScope.$digest();
    });

    it('persists the series only after season persistence completes', function() {
        var seasonPersist = $q.defer();
        season.Persist.and.returnValue(seasonPersist.promise);
        watchedCounter.recountSerie(1);

        queryDeferred.resolve(counts());
        $rootScope.$digest();
        expect(serie.Persist).not.toHaveBeenCalled();

        seasonPersist.resolve();
        $rootScope.$digest();
        expect(serie.Persist).toHaveBeenCalled();
    });

    it('continues with later IDs before reporting a failure', function() {
        var secondQuery = $q.defer();
        var expected = new Error('query failed');
        CRUD.executeQuery.and.returnValues(queryDeferred.promise, secondQuery.promise);
        var error;

        watchedCounter.recountSerie(1).catch(function(value) { error = value; });
        watchedCounter.recountSerie(2);
        queryDeferred.reject(expected);
        $rootScope.$digest();
        expect(CRUD.executeQuery.calls.count()).toBe(2);

        secondQuery.resolve(counts());
        $rootScope.$digest();
        expect(error).toBe(expected);
        expect(serie.Persist).toHaveBeenCalled();
    });
});
