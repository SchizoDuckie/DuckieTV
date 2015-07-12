/**
 * Gulp file (experimental) to concat all the scripts and minimize load time.
 * Usage:
 *
 * npm install
 *
 * to generate deployment packages:
 *
 * gulp deploy
 */

var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    concatCss = require('gulp-concat-css'),
    replace = require('gulp-replace'),
    notify = require('gulp-notify'),
    jsonedit = require("gulp-json-editor"),
    zip = require('gulp-zip'),
    fs = require('fs'),
    request = require('request'),
    spawn = require('child_process').spawn;

var ver = String(fs.readFileSync('VERSION')).trim();
var nightly = false; // for nightly builds




/**
 * Default and depoyment tasks:
 * Concats scripts, dependencies, background page, styles, alters the main template to use dist versions and writes all of this the local dist/ directory
 */
gulp.task('default', ['concatScripts', 'concatDeps', 'concatBackgroundPage', 'concatStyles', 'print.css', 'launch.js', 'tabTemplate' /*, 'scenenames'*/ ], function() {
    notify('packaging to dist/ done');
});


gulp.task('build-standalone', ['deploy'], function() {
    var path = process.cwd() + '/build/';
    console.log("building!");
    spawn(path + 'build_windows.sh', [], {
        cwd: path
    });
    spawn(path + 'build_mac.sh', [], {
        cwd: path
    });
    spawn(path + 'build_linux.sh', [], {
        cwd: path
    });
});




/**
 * Start the cascade to be able to create zip packages.
 * This executes, via sequence dependencies:
 * - default task
 * - copy dist files and dependencies into 3 individual directories in ../deploy/
 * - copy tab.html into place
 * - adjust manifests to include version info and write that to ../deploy/<flavour>/manifest.json
 * - zip files from ../deploy/<flavour>/ into ../deploy/<flavour>-<version>.zip
 * - copy that file into ../deploy/<flavour>-latest.zip
 */
gulp.task('deploy', ['zipbrowseraction', 'zipnewtab'], function() {
    var latestTag = nightly ? 'nightly' : 'latest';
    gulp.src('../deploy/newtab-' + ver + '.zip')
        .pipe(rename('newtab-' + latestTag + '.zip'))
        .pipe(gulp.dest('../deploy/'));
    gulp.src('../deploy/browseraction-' + ver + '.zip')
        .pipe(rename('browseraction-' + latestTag + '.zip'))
        .pipe(gulp.dest('../deploy/'));
    notify('DEPLOY done to ../deploy/ !');

});



/**
 * Zip the browser action version
 */
gulp.task('zipbrowseraction', ['manifests'], function() {
    return gulp.src('../deploy/browseraction/**')
        .pipe(zip('browseraction-' + ver + '.zip'))
        .pipe(gulp.dest('../deploy'));
});

/**
 * zip the new tab version
 */

gulp.task('zipnewtab', ['manifests'], function() {
    return gulp.src('../deploy/newtab/**')
        .pipe(zip('newtab-' + ver + '.zip'))
        .pipe(gulp.dest('../deploy'));
});