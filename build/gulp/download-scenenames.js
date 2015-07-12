var gulp = require('gulp'),
    replace = require('gulp-replace'),
    notify = require('gulp-notify'),
    request = require('request'),
    fs = require('fs');

gulp.task('scenenames', function() {
    notify('downloading new scene name exceptions');
    request('https://raw.githubusercontent.com/midgetspy/sb_tvdb_scene_exceptions/gh-pages/exceptions.txt', function(error, response, result) {
        var output = {};
        result = result.split(/,\r\n/g).map(function(line) {
            var l = line.match(/([0-9]+): '(.*)'/);
            if (l) {
                var candidates = l[2].split("', '");
                output[l[1]] = candidates[0].replace('\\\'', "'").replace(/\(US\)/, "").replace(/\([1-2][09]([0-9]{2})\)/, '').trim();
            }
        });
        var sceneNameFile = fs.readFileSync('js/services/SceneNameResolver.js');
        output = sceneNameFile.toString().replace(/exceptions \= (\{[\s\S]+\})\;/g, 'exceptions = ' + JSON.stringify(output, null, 4) + ';');
        fs.writeFileSync('js/services/SceneNameResolver.js', output);
        notify('SceneNameResolver.js was updated');
    });
});