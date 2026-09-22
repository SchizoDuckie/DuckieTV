describe('GenericTorrentSearchEngine', function() {
    var $q;
    var $rootScope;
    var http;
    var mirrorResolver;
    var engine;

    beforeEach(module('DuckieTV'));

    beforeEach(inject(function(_$q_, _$rootScope_) {
        $q = _$q_;
        $rootScope = _$rootScope_;
        http = jasmine.createSpy('http');
        mirrorResolver = {
            findMirror: jasmine.createSpy('findMirror')
        };
        var injector = {
            get: function(name) {
                if (name === 'SettingsService') {
                    return { get: angular.noop };
                }
                if (name === 'MirrorResolver') {
                    return mirrorResolver;
                }
            }
        };
        engine = new GenericTorrentSearchEngine({
            mirror: 'https://old.example',
            mirrorResolver: 'MirrorResolver',
            endpoints: { search: '/search/%s/%o' },
            selectors: { resultContainer: '.result' }
        }, $q, http, injector);
    }));

    it('parses and settles a successful search', function() {
        http.and.returnValue($q.when({ data: '<html></html>' }));
        var result;

        engine.search('show').then(function(value) { result = value; });
        $rootScope.$digest();

        expect(result).toEqual([]);
    });

    it('settles a 404 as an empty result', function() {
        http.and.returnValue($q.reject({ status: 404 }));
        var result;

        engine.search('missing').then(function(value) { result = value; });
        $rootScope.$digest();

        expect(result).toEqual([]);
    });

    it('rejects cancellation with the existing diagnostic', function() {
        http.and.returnValue($q.reject({ status: -1 }));
        var error;

        engine.search('cancelled').catch(function(value) { error = value; });
        $rootScope.$digest();

        expect(error).toContain('net::ERR_NO_RESPONSE');
    });

    it('returns the mirror retry and limits resolution to one attempt', function() {
        http.and.returnValues(
            $q.reject({ status: 500 }),
            $q.when({ data: '<html></html>' })
        );
        mirrorResolver.findMirror.and.returnValue($q.when('https://new.example'));
        var result;

        engine.search('retry').then(function(value) { result = value; });
        $rootScope.$digest();

        expect(result).toEqual([]);
        expect(http.calls.count()).toBe(2);
        expect(mirrorResolver.findMirror.calls.count()).toBe(1);
    });

    it('rejects an unrecognized error', function() {
        var expected = { status: 0 };
        http.and.returnValue($q.reject(expected));
        var error;

        engine.search('broken').catch(function(value) { error = value; });
        $rootScope.$digest();

        expect(error).toBe(expected);
    });
});
