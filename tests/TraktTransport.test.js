describe('TraktTVv2 transport policy', function() {
    var $httpBackend;
    var $rootScope;
    var TraktTVv2;

    beforeEach(module('DuckieTV', function($httpProvider) {
        $httpProvider.interceptors.length = 0;
    }));

    beforeEach(inject(function(_$httpBackend_, _$rootScope_, _TraktTVv2_) {
        $httpBackend = _$httpBackend_;
        $rootScope = _$rootScope_;
        TraktTVv2 = _TraktTVv2_;
        localStorage.setItem('trakttv.token', 'old-token');
        localStorage.setItem('trakttv.refresh_token', 'refresh-token');
    }));

    afterEach(function() {
        localStorage.removeItem('trakttv.token');
        localStorage.removeItem('trakttv.refresh_token');
    });

    it('shares one token refresh across concurrent 401 responses and retries with the new token', function() {
        var apiCalls = 0;
        var refreshedCalls = 0;
        var refreshCalls = 0;
        $httpBackend.whenGET(/https:\/\/api\.trakt\.tv\/sync\/(watched|collection)/).respond(function(method, url, data, headers) {
            apiCalls++;
            if (apiCalls <= 2) return [401, {}];
            if (headers.Authorization === 'Bearer new-token') refreshedCalls++;
            return [200, []];
        });
        $httpBackend.whenPOST(/https:\/\/auth\.trakt\.tv\/oauth\/token/).respond(function() {
            refreshCalls++;
            return [200, { access_token: 'new-token', refresh_token: 'new-refresh-token' }];
        });
        var watched;
        var collection;

        TraktTVv2.watched().then(function(result) { watched = result; });
        TraktTVv2.userShows().then(function(result) { collection = result; });
        $httpBackend.flush();

        expect(refreshCalls).toBe(1);
        expect(refreshedCalls).toBe(2);
        expect(watched).toEqual([]);
        expect(collection).toEqual([]);
    });

    it('applies authorization to POST requests and returns their response shape', function() {
        var authorization;
        $httpBackend.whenPOST(/https:\/\/api\.trakt\.tv\/sync\/history/).respond(function(method, url, data, headers) {
            authorization = headers.Authorization;
            return [200, { added: { episodes: 1 } }];
        });
        var response;

        TraktTVv2.markEpisodeWatched({}, { watchedAt: Date.now(), TRAKT_ID: 42 }).then(function(result) {
            response = result;
        });
        $httpBackend.flush();

        expect(authorization).toBe('Bearer old-token');
        expect(response.data.added.episodes).toBe(1);
    });

    it('settles a cancelled search without parsing a response', function() {
        $httpBackend.whenGET(/https:\/\/api\.trakt\.tv\/search\/show/).respond(200, []);
        var result = 'pending';
        TraktTVv2.search('cancel me').then(function(value) { result = value; });

        TraktTVv2.cancelSearch();
        $rootScope.$digest();

        expect(result).toBeUndefined();
        expect(TraktTVv2.hasActiveSearchRequest()).toBe(false);
    });

    it('propagates parser failures', function() {
        $httpBackend.whenGET(/https:\/\/api\.trakt\.tv\/search\/show/).respond(200, [{}]);
        var error;

        TraktTVv2.search('broken').catch(function(value) { error = value; });
        $httpBackend.flush();

        expect(error).toBeDefined();
    });
});
