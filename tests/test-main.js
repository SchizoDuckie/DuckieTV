function fixture(url) {
    url = './base/tests/fixtures/' + url.replace(/\W/g, '').replace(/_/g, '').toLowerCase() + '.json';

    var x = new XMLHttpRequest();
    x.open("GET", url, false);
    x.send();

    if (x.status === 200) {
        var out = JSON.parse(x.responseText);
        if (out.headers && out.headers['Content-Type'].indexOf('json') > -1) {
            return JSON.parse(out.content);
        } else {
            return ('content' in out) ? out.content : out;
        }
    } else {
        return null;
    }
}



jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

beforeEach(module('pascalprecht.translate'));
// overwrite useStaticFilesLoader to get rid of request to translation file
beforeEach(module(function($translateProvider) {
    $translateProvider.useStaticFilesLoader = function() {
        return $translateProvider
    };
    $translateProvider.registerAvailableLanguageKeys = function() {
        return $translateProvider
    };
    $translateProvider.use = function() {
        return $translateProvider
    }
}));

beforeEach(module('DuckieTV'));


beforeEach(inject(function($injector) {
    // Set up the mock http service responses
    $httpBackend = $injector.get('$httpBackend');

    $httpBackend.whenGET('fanart.cache.json').respond(function(method, url, data) {
        return [200, []];
    });

    $httpBackend.whenGET('./tests/proxy.php?url=https%3A%2F%2Fduckietv.github.io%2FSceneNameExceptions%2FSceneNameExceptions.json').respond(function(method, url, data) {
        return [200, []];
    });

    $httpBackend.whenGET('./tests/proxy.php?url=https%3A%2F%2Fduckietv.github.io%2FSceneNameExceptions%2FSceneDateExceptions.json').respond(function(method, url, data) {
        return [200, []];
    });

    $httpBackend.whenGET('./tests/proxy.php?url=https%3A%2F%2Fduckietv.github.io%2Fxem-cache%2Fmappings.json').respond(function(method, url, data) {
        return [200, []];
    });

    $httpBackend.whenGET('./tests/proxy.php?url=https%3A%2F%2Fduckietv.github.io%2Fxem-cache%2Faliasmap.json').respond(function(method, url, data) {
        return [200, []];
    });

    $httpBackend.whenGET('http://localhost:8080/gui/token.html').respond(function(method, url, data) {
        return [500, []];
    });

    $httpBackend.whenGET('VERSION').respond(function(method, url, data) {
        return [200, null];
    });

    $httpBackend.whenGET('./tests/proxy.php?url=https%3A%2F%2Fraw.githubusercontent.com%2Fngosang%2Ftrackerslist%2Fmaster%2Ftrackers_best.txt').respond(function(method, url, data) {
        return [200, []];
    });

}));



afterEach(function() {
    inject(function(_$rootScope_) {
        _$rootScope_.$apply();
    })
});