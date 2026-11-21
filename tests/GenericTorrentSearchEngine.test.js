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
            selectors: { resultContainer: '.result' },
            detailsSelectors: {
                detailsContainer: '.downloads',
                magnetUrl: ['a.magnet', 'href'],
                torrentUrl: ['a.torrent', 'href']
            }
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

    it('reports an unreadable details page when the details container is absent', function() {
        http.and.returnValue($q.when({ data: '<h1>Torrent removed</h1>' }));
        var error;

        engine.getDetails('https://old.example/details', 'Show').catch(function(value) { error = value; });
        $rootScope.$digest();

        expect(error instanceof Error).toBe(true);
        expect(error.message).toContain('The torrent details could not be read');
    });

    it('returns no download links when the details container is present without links', function() {
        http.and.returnValue($q.when({ data: '<div class="downloads"></div>' }));
        var details;

        engine.getDetails('https://old.example/details', 'Show').then(function(value) { details = value; });
        $rootScope.$digest();

        expect(details).toEqual({});
    });

    it('reads download links when the details container is present', function() {
        var magnet = 'magnet:?xt=urn:btih:0123456789012345678901234567890123456789';
        http.and.returnValue($q.when({
            data: '<div class="downloads"><a class="magnet" href="' + magnet + '"></a>' +
                '<a class="torrent" href="/show.torrent"></a></div>'
        }));
        var details;

        engine.getDetails('https://old.example/details', 'Show').then(function(value) { details = value; });
        $rootScope.$digest();

        expect(details).toEqual({ magnetUrl: magnet, torrentUrl: 'https://old.example/show.torrent' });
    });

    it('propagates an HTTP failure when fetching details', function() {
        var expected = { status: 503 };
        http.and.returnValue($q.reject(expected));
        var error;

        engine.getDetails('https://old.example/details', 'Show').catch(function(value) { error = value; });
        $rootScope.$digest();

        expect(error).toBe(expected);
    });
});
