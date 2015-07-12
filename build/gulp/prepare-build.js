/**
 * Tasks for internal use
 * Each task called by the main task is listing the tasks that need to be executed as dependencies as an array as the second argument
 * Since tasks run in parallell by default, this can seem confusing at first, but this is what's happening in promise form
 *
 * - buildTemplateCache
 * - concatScripts, concatDeps, concatBackgroundPage, concatStyles, print.css, launch.js, tabTemplate
 * - copyToDeploy
 * - copytab
 * - manifests
 
 */

/**
 * Concat the scripts array into a file named dist/app.js
 */
gulp.task('concatScripts', function() {
    return gulp.src(scripts)
        .pipe(concat('app.js', {
            newLine: ';'
        }))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'Scripts packaged to dist/app.js'
        }));
});

/**
 * Concat the dependencies array into a file named dist / deps.js
 */
gulp.task('concatDeps', function() {

    var tab = fs.readFileSync('tab.html').toString();
    var matches = tab.match(/<!-- deploy:replace\=\'(.*)\' -->([\s\S]+?)[^\/deploy:]<!-- \/deploy:replace -->/g);
    var deps = [];
    matches.map(function(match) {
        if (match.indexOf('dist\/deps.js') > -1) {
            deps = match.match(/\.(\/js\/[a-zA-Z0-9\/\.\-]+)/g).map(function(script) {
                if (script.indexOf('.min.js') >= -1) {
                    return script;
                } else {
                    var mifi = script.replace('.js', '.min.js');
                    return fs.existsSync(mifi) ? mifi : script;
                }
            });
        }
    });
    return gulp.src(deps)
        .pipe(concat('deps.js', {
            newLine: ';'
        }))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'Deps packaged to dist/deps.js'
        }));
});

/**
 * Concat the background page and it's dependencies into dist/background.js
 */
gulp.task('concatBackgroundPage', function() {
    return gulp.src(background)
        .pipe(concat('background.js', {
            newLine: ';'
        }))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'Background page packaged to dist/background.js'
        }));
});

/** 
 * Copy launch.js into place
 */
gulp.task('launch.js', function() {
    return gulp.src(['launch.js', 'package.json'])
        .pipe(gulp.dest('dist/'));
});

var templateCache = require('gulp-angular-templatecache');
gulp.task('buildTemplateCache', function() {
    return gulp.src(['templates/*.html', 'templates/**/*.html'])
        .pipe(templateCache({
            module: 'DuckieTV'
        }))
        .pipe(gulp.dest('dist'))
        .pipe(notify({
            message: 'Templatecache deployed'
        }));
});



/**
 * Parse tab.html and grab the deploy:replace comments sections.
 * Grab the parameter value to those tags, and replace the content with that so that we're left with with just a couple of includes
 */
gulp.task('tabTemplate', ['buildTemplateCache'], function() {
    return gulp.src(['tab.html'])
        .pipe(replace(/<!-- deploy:replace\=\'(.*)\' -->([\s\S]+?)[^\/deploy:]<!-- \/deploy:replace -->/g, '$1'))
        .pipe(replace('</body>', '<script src="dist/templates.js"></script></body>'))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'Tab template deployed'
        }));
});

/**
 * Concat the styles.js into dist/style.css
 */
gulp.task('concatStyles', function() {
    return gulp.src(styles)
        .pipe(concatCss("style.css"))
        .pipe(gulp.dest('dist/'))
        .pipe(notify({
            message: 'Styles concatted'
        }));
});

/**
 * Move print.css into place
 */
gulp.task('print.css', function() {
    return gulp.src('css/print.css')
        .pipe(gulp.dest('dist/'));
});

/**
 * Deployment and packaging functions
 */

gulp.task('copyToDeploy', ['default'], function() {
    return gulp.src(['VERSION', 'trakt-trending-500.json', '_locales/**', 'dist/**', 'fonts/**', 'img/**', 'templates/**'], {
            "base": "."
        })
        .pipe(gulp.dest('../deploy/browseraction'))
        .pipe(gulp.dest('../deploy/newtab'));
});

/**
 * Copy the altered tab.html into place
 */
gulp.task('copytab', ['copyToDeploy'], function() {
    return gulp.src('dist/tab.html')
        .pipe(gulp.dest('../deploy/browseraction'))
        .pipe(gulp.dest('../deploy/newtab'));
});

/**
 * Adjust all 3 versions of manifest.json to use the dist versions of scripts
 * launch.js contains the button attach code for browser-action mode
 * Also updates the manifest to include the latest version defined in the VERSION file
 */
gulp.task('manifests', ['copytab'], function() {

    // js-format formatting options used in manipulating manifest.json
    var formatOptions = {
        'indent_char': '\t',
        'indent_size': 1,
        'brace_style': 'end-expand'
    };

    var noLaunch = function(json) {
        json.version = ver;
        json.background.scripts = ['dist/background.js'];
        return json;
    };

    /**
     * Modify package.json to remove the whole list of background scripts and replace it with dist version and launch.js
     */
    var withLaunch = function(json) {
        json.version = ver;
        json.background.scripts = ['dist/background.js', 'dist/launch.js'];
        return json;
    };

    if (nightly) {
        console.log('nightly mode!');
        gulp.src('./_locales/**/messages.json')
            .pipe(jsonedit(function(json) {
                json.appNameNewTab.message += " - Canary";
                json.appShortNameNewTab.message += " - Canary";
                json.appNameBrowserAction.message += " - Canary";
                json.appShortNameBrowserAction.message += " - Canary";
                return json;
            }, formatOptions))
            .pipe(gulp.dest('../deploy/newtab/_locales/'))
            .pipe(gulp.dest('../deploy/browseraction/_locales/'));
    }

    gulp.src('manifest.json')
        .pipe(jsonedit(noLaunch, formatOptions))
        .pipe(gulp.dest('../deploy/newtab/'));
    return gulp.src('manifest-app.json')
        .pipe(rename('manifest.json'))
        .pipe(jsonedit(withLaunch, formatOptions))
        .pipe(gulp.dest('../deploy/browseraction/'));
});