/**
 * Gulp file (experimental) to concat all the scripts and minimize load time.
 * Usage:
 *
 * npm install gulp gulp-autoprefixer gulp-minify-css gulp-jshint gulp-concat gulp-notify gulp-rename gulp-replace --save-dev
 * gulp
 */


var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    concatCss = require('gulp-concat-css'),
    replace = require('gulp-replace'),
    notify = require('gulp-notify');

// scripts are provided in order to prevent any problems with the load order dependencies
var scripts = ['./js/controllers/*.js', './js/directives/*.js','./js/services/*.js', './js/app.js'];


var deps = ['./js/vendor/promise-3.2.0.js',
'./js/vendor/CRUD.js',
'./js/vendor/CRUD.SqliteAdapter.js',
'./js/CRUD.entities.js',
"./js/vendor/angular.js",
"./js/vendor/angular-animate.js",
"./js/vendor/angular-sanitize.min.js",
"./js/vendor/angular-route.min.js",
"./js/vendor/angular-xml.min.js",
'./js/vendor/ui-bootstrap-tpls-0.11.2.min.js',
'./js/vendor/tmhDynamicLocale.js',
"./js/vendor/datePicker.js",
"./js/vendor/dialogs.js",
"./js/vendor/angular-translate.min.js",
"./js/vendor/angular-translate-loader-static-files.min.js",
"./js/vendor/angular-translate-handler-log.min.js",
"./js/vendor/sha1.js" ];

var styles = [
    './css/bootstrap.min.css',
    './css/main.css',
    './css/anim.css',
    './css/dialogs.css',
    './css/flags.css'
];

gulp.task('default', function() {
    
    gulp.src(scripts)
    .pipe(concat('app.js', {newLine: ';'}))
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Scripts packaged to dist/app.js' }));

    /**
     * Package all the app's dependencies from the vendors foldr
     */
    gulp.src(deps)
    .pipe(concat('deps.js', {newLine: ';'}))
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Deps packaged to dist/deps.js' }));

    /**
     * replace tab.html's placeholders that indicate the deployment scripts 
     */
    gulp.src(['tab.html'])
    .pipe(replace(/<!-- deploy:replace\=\'(.*)\' -->([\s\S]+?)[^\/deploy:]<!-- \/deploy:replace -->/g, '$1'))
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Tab template deployed' }));

     gulp.src(styles)
        .pipe(concatCss("style.css"))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'Styles concatted' }));
     gulp.src('css/print.css')
        .pipe(gulp.dest('dist/'));

});
 