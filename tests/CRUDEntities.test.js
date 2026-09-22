describe('CRUD entity bulk episode mutations', function() {
    function episode(options) {
        return angular.extend({
            hasAired: function() { return true; },
            isWatched: function() { return false; },
            isDownloaded: function() { return false; },
            markWatched: jasmine.createSpy('markWatched').and.returnValue(Promise.resolve()),
            markNotWatched: jasmine.createSpy('markNotWatched').and.returnValue(Promise.resolve()),
            markDownloaded: jasmine.createSpy('markDownloaded').and.returnValue(Promise.resolve())
        }, options || {});
    }

    it('waits for every eligible series episode mutation', function(done) {
        var finishFirst;
        var finishSecond;
        var first = episode({
            markDownloaded: jasmine.createSpy('first').and.returnValue(new Promise(function(resolve) { finishFirst = resolve; }))
        });
        var second = episode({
            markDownloaded: jasmine.createSpy('second').and.returnValue(new Promise(function(resolve) { finishSecond = resolve; }))
        });
        var serie = new Serie();
        serie.getEpisodes = function() { return Promise.resolve([first, second]); };
        var settled = false;

        serie.markSerieAsDownloaded().then(function(result) {
            settled = true;
            expect(result).toBe(true);
            done();
        });

        setTimeout(function() {
            expect(settled).toBe(false);
            finishFirst();
            setTimeout(function() {
                expect(settled).toBe(false);
                finishSecond();
            }, 0);
        }, 0);
    });

    it('skips ineligible episodes', function(done) {
        var future = episode({ hasAired: function() { return false; } });
        var watched = episode({ isWatched: function() { return true; } });
        var eligible = episode();
        var serie = new Serie();
        serie.getEpisodes = function() { return Promise.resolve([future, watched, eligible]); };

        serie.markSerieAsWatched().then(function() {
            expect(future.markWatched).not.toHaveBeenCalled();
            expect(watched.markWatched).not.toHaveBeenCalled();
            expect(eligible.markWatched).toHaveBeenCalled();
            done();
        });
    });

    it('propagates an episode persistence failure', function(done) {
        var expected = new Error('write failed');
        var broken = episode({
            markNotWatched: jasmine.createSpy('broken').and.returnValue(Promise.reject(expected)),
            isWatched: function() { return true; }
        });
        var serie = new Serie();
        serie.getEpisodes = function() { return Promise.resolve([broken]); };

        serie.markSerieAsUnWatched().then(function() {
            done.fail('expected rejection');
        }, function(error) {
            expect(error).toBe(expected);
            done();
        });
    });

    it('persists the season only after its episode writes finish', function(done) {
        var finishEpisode;
        var item = episode({
            markWatched: jasmine.createSpy('markWatched').and.returnValue(new Promise(function(resolve) { finishEpisode = resolve; }))
        });
        var season = new Season();
        season.getEpisodes = function() { return Promise.resolve([item]); };
        season.Persist = jasmine.createSpy('Persist').and.returnValue(Promise.resolve());

        season.markSeasonAsWatched().then(function(result) {
            expect(result).toBe(true);
            expect(season.watched).toBe(1);
            expect(season.Persist).toHaveBeenCalled();
            done();
        });

        setTimeout(function() {
            expect(season.Persist).not.toHaveBeenCalled();
            finishEpisode();
        }, 0);
    });
});
