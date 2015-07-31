/**
 * Gulp file that prepares build output for DuckieTV.
 *
 * Usage:
 *
 * npm install
 *
 * to generate deployment code:
 *
 * gulp
 *
 * to generate deployment code and then installers, use:
 * cd build
 * ./build_all.sh
 */

var gulp = require('gulp'),
    fs = require('fs'),
    clean = require('gulp-clean');

require('./build/gulp/download-scenenames.js');
require('./build/gulp/prepare-build.js');
require('./build/gulp/publish-webstore-nightly.js');
require('./build/gulp/xem.js');

gulp.task('clean', function() {
    return gulp.src(['../deploy/browseraction', '../deploy/newtab', '../deploy/cordova', '../deploy/standalone'], {
            read: false
        })
        .pipe(clean({
            force: true
        }));
});

/**
 * Default and depoyment tasks:
 * Concats scripts, dependencies, background page, styles, alters the main template to use dist versions and writes all of this the local dist/ directory
 */
gulp.task('default', ['clean' /*, 'scenenames'*/ ], function() {

    gulp.start('manifests');

});