var gulp = require('gulp'),
    notify = require('gulp-notify'),
    request = require('request'),
    fs = require('fs'),
    mkdirp = require('mkdirp');


var lastRequest = new Date().getTime();
var queueTimeout = false;
var requests = [];
var requestCounter = 0;
var responseCounter = 0;
var haveSceneMappings = [];
var root = process.cwd() + '/../deploy/xem';
mkdirp(root);


function queueRequest(url, callback) {
    requests.push([url, callback]);
    if (!queueTimeout) {
        queueTimeout = setTimeout(processQueue, 1500);
    }
}

function processQueue() {
    if (requests.length > 0) {
        requestCounter++;
        var currentRequest = requests.shift();
        console.log("Processing request " + requestCounter + ". Queued:" + requests.length, currentRequest[0]);
        request(currentRequest[0], currentRequest[1]);
        queueTimeout = setTimeout(processQueue, 1500);
    } else {
        if (requestCounter == responseCounter && requests.length == 0) {
            fs.writeFileSync(root + '/mappings.json', JSON.stringify(haveSceneMappings, true, 2));
            notify('TheXEM cache was updated');
        } else {
            setTimeout(processQueue, 1000);

        }
    }
}

/**
 * Fetch TVDB -> Scene name season and episode mappings from TheXEM.de
 *
 * Does some preparsing to fetch the list of all the mappings on thexem that have actual mappings.
 */
gulp.task('xem', function() {
    // output the xem files to the deploy dir

    notify('downloading new scene episode mappings from thexem.de');

    // fetch list of all shows that have a mapping
    return request('http://thexem.de/map/havemap?origin=tvdb&destination=scene', function(error, response, result) {
        var output = {};
        var data = JSON.parse(result).data;
        data.map(function(tvdb) {
            // fetch show details. May return 0 results for having both origin tvdb and destination scene!
            queueRequest('http://thexem.de/map/all?id=' + tvdb + '&origin=tvdb&destination=scene', function(error, response, result) {
                console.log('Fetched ', tvdb);
                responseCounter++;
                try {
                    console.log("Saving? ");
                    var res = JSON.parse(result);
                    console.log(res.data.length > 0 ? ' yes' : 'no');
                    // only cache output when there are mapping results. also put the id in haveSceneMappings.
                    if (res.data.length > 0) {
                        fs.writeFileSync(root + '/' + tvdb + '.json', JSON.stringify(res.data, true, 2));
                        haveSceneMappings.push(parseInt(tvdb));
                    }
                } catch (E) {
                    console.error('Nope, Error fetching:', E);
                }
            });
        });
    });
});