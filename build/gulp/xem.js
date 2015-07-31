var gulp = require('gulp'),
    notify = require('gulp-notify'),
    request = require('request'),
    fs = require('fs'),
    mkdirp = require('mkdirp');

gulp.task('xem', function() {
    var root = process.cwd() + '/../deploy/xem';
    mkdirp(root);
    notify('downloading new scene episode mappings from thexem.de');
    return request('http://thexem.de/map/havemap?origin=tvdb&destination=scene', function(error, response, result) {
        var output = {};
        var data = JSON.parse(result).data;
        var haveSceneMappings = [];
        return Promise.all(data.map(function(tvdb) {
            console.log('Fetching ', tvdb);

            return request('http://thexem.de/map/all?id=' + tvdb + '&origin=tvdb&destination=scene', function(error, response, result) {
                var res = JSON.parse(result);
                console.log('Fetched ', tvdb, ' Saving?',
                    res.data.length > 0 ? ' yes' : 'no');
                if (res.data.length > 0) {
                    fs.writeFileSync(root + '/' + tvdb + '.json', JSON.stringify(res.data, true, 2));
                    haveSceneMappings.push(tvdb);
                }
                return true;
            });
        }));
        fs.writeFileSync(root + '/mappings.json', JSON.stringify(haveSceneMappings, true, 2));
        notify('TheXEM cache was updated');
    });
});