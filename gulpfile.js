/**
 * Gulp file (experimental) to concat all the scripts and minimize load time.
 * Usage:
 *
 * npm install gulp gulp-autoprefixer gulp-minify-css gulp-jshint gulp-concat gulp-uglify gulp-imagemin gulp-notify gulp-rename gulp-livereload gulp-cache del --save-dev
 * gulp scripts
 */


var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    minifycss = require('gulp-minify-css'),
    jshint = require('gulp-jshint'),
    uglify = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    notify = require('gulp-notify'),
    cache = require('gulp-cache'),
    livereload = require('gulp-livereload'),
    del = require('del');

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
'./js/vendor/ui-bootstrap-tpls-0.10.0.min.js',
'./js/vendor/tmhDynamicLocale.js',
"./js/vendor/datePicker.js",
"./js/vendor/dialogs.js",
"./js/vendor/angular-translate.min.js",
"./js/vendor/angular-translate-loader-static-files.min.js",
"./js/vendor/angular-translate-handler-log.min.js",
"./js/vendor/sha1.js" ];

gulp.task('scripts', function() {
  gulp.src(scripts)
    .pipe(concat('app.js', {newLine: ';'}))
    .pipe(gulp.dest('dist/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Scripts packaged to dist/app.js' }));

    return gulp.src(deps)
    .pipe(concat('deps.js', {newLine: ';'}))
    .pipe(gulp.dest('dist/'))
    .pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/'))
    .pipe(notify({ message: 'Deps packaged to dist/deps.js' }));

});

