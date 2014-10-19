/**
 * Gulp file (experimental) to concat all the scripts and minimize load time.
 * Usage:
 *
 * npm install gulp gulp-autoprefixer gulp-minify-css gulp-jshint gulp-concat gulp-notify gulp-rename gulp-replace gulp-json-editor js-beautify --save-dev
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
    notify = require('gulp-notify'),
    jsonedit = require("gulp-json-editor"),
    zip = require('gulp-zip'),
    fs = require('fs');

 var ver = String(fs.readFileSync('VERSION'));
  
// scripts are provided in order to prevent any problems with the load order dependencies
var scripts = ['./js/controllers/*.js', './js/directives/*.js','./js/services/*.js', './js/app.js'];


var deps = ['./js/vendor/promise-3.2.0.js',
'./js/vendor/CRUD.js',
'./js/vendor/CRUD.SqliteAdapter.js',
'./js/CRUD.entities.js',
"./js/vendor/angular.min.js",
"./js/vendor/angular-sanitize.min.js",
"./js/vendor/angular-route.min.js",
"./js/vendor/angular-xml.min.js",
"./js/vendor/ui-bootstrap-tpls-0.10.0.min.js",
"./js/vendor/tmhDynamicLocale.js",
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

var background = [
    "js/vendor/promise-3.2.0.js",
    "js/vendor/CRUD.js",
    "js/vendor/CRUD.SqliteAdapter.js",
    "js/CRUD.entities.js",
    "js/vendor/angular.min.js",
    "js/vendor/angular-sanitize.min.js",
    "js/directives/torrentDialog.js",
    "js/services/SettingsService.js",
    "js/services/StorageSyncService.js",
    "js/services/SceneNameResolver.js",
    "js/services/EventWatcherService.js",
    "js/services/EventSchedulerService.js",
    "js/services/EpisodeAiredService.js",
    "js/services/FavoritesService.js",
    "js/services/TraktTV.js",
    "js/services/ThePirateBay.js",
    "js/services/MirrorResolver.js",
    "js/services/WatchlistCheckerService.js",
    "js/services/WatchlistService.js",
    "js/background.js"
]

gulp.task('concatScripts',function() {
    return gulp.src(scripts)
        .pipe(concat('app.js', {newLine: ';'}))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'Scripts packaged to dist/app.js' }));
})

gulp.task('concatDeps',function() {
     return gulp.src(deps)
        .pipe(concat('deps.js', {newLine: ';'}))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'Deps packaged to dist/deps.js' }));
})

gulp.task('concatBackgroundPage', function() {
    return gulp.src(background)
        .pipe(concat('background.js', {newLine: ';'}))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'Background page packaged to dist/background.js' }));
})

gulp.task('launch.js', function() {
    return gulp.src('launch.js')
        .pipe(gulp.dest('dist/'));
})

gulp.task('tabTemplate', function() {
     return gulp.src(['tab.html'])
        .pipe(replace(/<!-- deploy:replace\=\'(.*)\' -->([\s\S]+?)[^\/deploy:]<!-- \/deploy:replace -->/g, '$1'))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({ message: 'Tab template deployed' }));
})


gulp.task('concatStyles', function() {
    return gulp.src(styles)
            .pipe(concatCss("style.css"))
            .pipe(gulp.dest('dist/'))
            .pipe(notify({ message: 'Styles concatted' }));
})

gulp.task('print.css', function() {
    return gulp.src('css/print.css')
        .pipe(gulp.dest('dist/'));
})
gulp.task('default', ['concatScripts','concatDeps','concatBackgroundPage','concatStyles','launch.js','tabTemplate'], function() {
    notify('packaging to dist/ done');
});
 
gulp.task('copyToDeploy', ['default'], function() {
  return gulp.src(['VERSION', '_locales/**','dist/**','fonts/**','img/**','templates/**'],{ "base" : "." })
        .pipe(gulp.dest('../deploy/browseraction'))
        .pipe(gulp.dest('../deploy/newtab'))
        .pipe(gulp.dest('../deploy/opera'));
});

gulp.task('copytab', ['copyToDeploy'], function() {
    return gulp.src('dist/tab.html')
        .pipe(gulp.dest('../deploy/browseraction'))
        .pipe(gulp.dest('../deploy/newtab'))
        .pipe(gulp.dest('../deploy/opera'));
});

gulp.task('copychromecast',['copyToDeploy'], function() {
     return gulp.src('js/vendor/cast_sender.js')
            .pipe(gulp.dest('../deploy/browseraction/js/vendor/'))
            .pipe(gulp.dest('../deploy/newtab/js/vendor/'))
            .pipe(gulp.dest('../deploy/opera/js/vendor/'));
});

gulp.task('manifests',['copychromecast','copytab'], function() {
     
     // js-format formatting options used in manipulating manifest.json
    var formatOptions = {
        'indent_char': '\t',
        'indent_size': 1,
        'brace_style': 'end-expand'
    }

    var noLaunch = function(json) {
        json.version = ver;
        json.background.scripts = ['dist/background.js'];
        return json;
    }

    /**
     * Modify package.json to remove the whole list of background scripts and replace it with dist version and launch.js
     */
    var withLaunch = function(json) {
        json.version = ver;
        json.background.scripts = ['dist/background.js','dist/launch.js'];
        return json;
    }

    gulp.src('manifest.json')
            .pipe(jsonedit(noLaunch, formatOptions))
            .pipe(gulp.dest('../deploy/newtab/'));
    gulp.src('manifest-app.json')
            .pipe(rename('manifest.json'))
            .pipe(jsonedit(withLaunch, formatOptions))
            .pipe(gulp.dest('../deploy/browseraction/'));
    return gulp.src('manifest-opera.json')
            .pipe(rename('manifest.json'))
            .pipe(jsonedit(withLaunch, formatOptions))
            .pipe(gulp.dest('../deploy/opera/'));
});

gulp.task('zipbrowseraction', ['manifests'], function() {
     return gulp.src('../deploy/browseraction/**')
            .pipe(zip('browseraction-'+ver+'.zip'))
            .pipe(gulp.dest('../deploy'))
});

gulp.task('zipnewtab', ['manifests'], function() {
     return gulp.src('../deploy/newtab/**')
            .pipe(zip('newtab-'+ver+'.zip'))
            .pipe(gulp.dest('../deploy'))
});

gulp.task('zipopera', ['manifests'], function() {
    return gulp.src('../deploy/opera/**')
            .pipe(zip('opera-'+ver+'.zip'))
            .pipe(gulp.dest('../deploy'));
});


gulp.task('zipfiles', ['zipbrowseraction','zipnewtab','zipopera'], function() {
   
})


gulp.task('deploy', ['zipfiles'], function() {
    
    gulp.src('../deploy/newtab-'+ver+'.zip')
            .pipe(rename('newtab-latest.zip'))
            .pipe(gulp.dest('../deploy/'));
    gulp.src('../deploy/browseraction-'+ver+'.zip')
            .pipe(rename('browseraction-latest.zip'))
            .pipe(gulp.dest('../deploy/'));
    gulp.src('../deploy/opera-'+ver+'.zip')
            .pipe(rename('opera-latest.zip'))
            .pipe(gulp.dest('../deploy/')); 
    notify('DEPLOY done to ../deploy/ !');    

});