var gulp = require('gulp'),
    notify = require('gulp-notify'),
    request = require('request'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

/**
 * Fetch TVDB -> Scene name season and episode mappings from TheXEM.de
 *
 * Does some preparsing to fetch the list of all the mappings on thexem that have actual mappings.
 */
gulp.task('xem', function() {
    // output the xem files to the deploy dir
    var root = process.cwd() + '/../deploy/xem';
    mkdirp(root);
    notify('downloading new scene episode mappings from thexem.de');

    // fetch list of all shows that have a mapping
    return request('http://thexem.de/map/havemap?origin=tvdb&destination=scene', function(error, response, result) {
        var output = {};
        var data = JSON.parse(result).data;
        var haveSceneMappings = [];
        return Promise.all(data.map(function(tvdb) {
            console.log('Fetching ', tvdb);
            // fetch show details. May return 0 results for having both origin tvdb and destination scene!
            return request('http://thexem.de/map/all?id=' + tvdb + '&origin=tvdb&destination=scene', function(error, response, result) {
                var res = JSON.parse(result);
                console.log('Fetched ', tvdb, ' Saving?',
                    res.data.length > 0 ? ' yes' : 'no');
                // only cache output when there are mapping results. also put the id in haveSceneMappings.
                if (res.data.length > 0) {
                    fs.writeFileSync(root + '/' + tvdb + '.json', JSON.stringify(res.data, true, 2));
                    haveSceneMappings.push(tvdb);
                }
                return true;
            });
        }));
        // write the final scenemappings file: all tvdb id's that have XEM mappings. 
        fs.writeFileSync(root + '/mappings.json', JSON.stringify(haveSceneMappings, true, 2));
        notify('TheXEM cache was updated');
    });
});