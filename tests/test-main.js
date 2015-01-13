var allTestFiles = [];
var TEST_REGEXP = /(spec|test)\.js$/i;

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

Object.keys(window.__karma__.files).forEach(function(file) {
    if (TEST_REGEXP.test(file)) {
        // Normalize paths to RequireJS module names.
        allTestFiles.push(pathToModule(file));
    }
});

function fixture(url) {
    url = './base/tests/fixtures/' + url.replace(/\W/g, '').replace(/_/g, '').toLowerCase() + '.json';

    var x = new XMLHttpRequest();
    x.open("GET", url, false);
    x.send();

    if (x.status === 200) {
        var out = JSON.parse(x.responseText);
        if (out.headers['Content-Type'].indexOf('json') > -1) {
            return JSON.parse(out.content);
        } else {
            return out.content;
        }
    } else {
        return null;
    }
}

require.config({
    // Karma serves files under /base, which is the basePath from your config file
    baseUrl: '/base',

    // dynamically load all test files
    deps: allTestFiles,

    // we have to kickoff jasmine, as it is asynchronous
    callback: window.__karma__.start
});