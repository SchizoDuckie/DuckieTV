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

// Unit tests instantiate services directly. Application startup blocks perform
// database, network, and navigation work that belongs in an end-to-end lane.
DuckieTV._runBlocks = [];
