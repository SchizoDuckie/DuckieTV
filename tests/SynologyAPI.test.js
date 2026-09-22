describe('SynologyAPI', function() {
    var $http;
    var $q;
    var $rootScope;
    var SettingsService;
    var SynologyAPI;

    function createService(sessionID) {
        $http = {
            post: jasmine.createSpy('post')
        };
        SettingsService = {
            get: jasmine.createSpy('get').and.returnValue(sessionID),
            set: jasmine.createSpy('set')
        };

        module('DuckieTV', function($provide) {
            $provide.value('$http', $http);
            $provide.value('SettingsService', SettingsService);
        });

        inject(function(_$q_, _$rootScope_, _SynologyAPI_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            SynologyAPI = _SynologyAPI_;
        });
    }

    function response(data) {
        return {
            data: {
                data: data
            }
        };
    }

    it('shares concurrent API discovery and returns the discovered API', function() {
        createService(null);
        var deferred = $q.defer();
        var firstResult;
        var secondResult;
        var api = {
            'SYNO.API.Info': { path: 'query.cgi' }
        };
        $http.post.and.returnValue(deferred.promise);

        SynologyAPI.fetchAPIInfo().then(function(result) { firstResult = result; });
        SynologyAPI.fetchAPIInfo().then(function(result) { secondResult = result; });

        expect($http.post.calls.count()).toBe(1);
        deferred.resolve(response(api));
        $rootScope.$digest();
        expect(firstResult).toBe(api);
        expect(secondResult).toBe(api);
    });

    it('clears a failed API discovery so it can be retried', function() {
        createService(null);
        var failed = $q.defer();
        var retried = $q.defer();
        $http.post.and.returnValues(failed.promise, retried.promise);

        SynologyAPI.fetchAPIInfo().catch(angular.noop);
        failed.reject(new Error('offline'));
        $rootScope.$digest();
        SynologyAPI.fetchAPIInfo();

        expect($http.post.calls.count()).toBe(2);
    });

    it('returns a cached session and deauthorizes the shared session owner', function() {
        createService('cached-session');
        var session;

        SynologyAPI.init().then(function(result) { session = result; });
        $rootScope.$digest();
        expect(session).toBe('cached-session');
        expect(SynologyAPI.getSessionID()).toBe('cached-session');

        SynologyAPI.deAuthorize();
        expect(SynologyAPI.isAuthenticated()).toBe(false);
        expect(SettingsService.set).toHaveBeenCalledWith('synology.sessionID', null);
    });

    it('adds the active session to requests without retaining it in caller parameters', function() {
        createService('session-id');
        var deferred = $q.defer();
        var parameters = { path: 'query.cgi', method: 'query', version: 1 };
        $http.post.and.returnValue(deferred.promise);

        SynologyAPI.Poster(parameters);

        expect($http.post.calls.argsFor(0)[1]).toContain('_sid=session-id');
        expect(parameters._sid).toBeUndefined();
    });
});
