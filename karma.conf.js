// Karma configuration
// Generated on Sun Jan 11 2015 18:02:53 GMT+0100 (W. Europe Standard Time)

module.exports = function(config) {
    var configuration = {

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '.',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine', 'requirejs'],


        // list of files / patterns to load in the browser
        files: [
            'tests/test-main.js',
            'js/vendor/promise-3.2.0.js',
            'js/vendor/CRUD.js',
            'js/vendor/CRUD.SqliteAdapter.js',
            'js/vendor/angular.js',
            'js/vendor/angular-mocks.js',
            'js/vendor/angular-animate.min.js',
            'js/vendor/angular-sanitize.min.js',
            'js/vendor/angular-route.min.js',
            'js/vendor/angular-translate.min.js',
            'js/vendor/angular-translate-loader-static-files.min.js',
            'js/vendor/tmhDynamicLocale.js',
            'js/vendor/dialogs.js',
            'js/vendor/datePicker.js',
            'js/vendor/ui-bootstrap-tpls-0.10.0.min.js',

            'js/CRUD.entities.js',
            'js/*.js',
            'js/directives/*.js',
            'js/services/*.js',
            'js/controllers/*.js', {
                pattern: 'tests/**.test.js',
                included: false
            }, {
                pattern: 'tests/fixtures/*.json',
                included: false
            }
        ],

        exclude: [
            'js/background.js',
            'tests/*.spec.js'
        ],



        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {},


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        //reporters: ['mocha'],
        reporters: ['mocha'],

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,
        browserDisconnectTimeout: 60000,
        browserNoActivityTimeout: 60000,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'],
        customLaunchers: {
            Chrome_travis_ci: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        },

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false
    };


    if (process.env.TRAVIS) {
        configuration.browsers = ['Chrome_travis_ci'];
    }

    config.set(configuration);
};