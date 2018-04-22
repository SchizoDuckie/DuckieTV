// Karma configuration
// Generated on Sun Jan 11 2015 18:02:53 GMT+0100 (W. Europe Standard Time)

module.exports = function(config) {
    var configuration = {

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '.',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            'js/vendor/promise.min.js',
            'js/vendor/CRUD.js',
            'js/vendor/CRUD.SqliteAdapter.js',
            'js/vendor/angular.js',
            'js/vendor/angular-mocks.js',
            'js/vendor/angular-animate.min.js',
            'js/vendor/angular-sanitize.min.js',
            'js/vendor/angular-messages.min.js',
            'js/vendor/angular-translate.js',
            'js/vendor/angular-translate-loader-static-files.min.js',
            'js/vendor/angular-translate-loader-partial.min.js',
            'js/vendor/tmhDynamicLocale.js',
            'js/vendor/dialogs.quacked.js',
            'js/vendor/ui-bootstrap-custom-tpls-2.5.0.min.js',
            'js/vendor/ui-router.min.js',
            'js/vendor/ct-ui-router-extras.core.min.js',
            'js/vendor/ct-ui-router-extras.sticky.min.js',
            'js/vendor/api-check.min.js',
            'js/vendor/formly.min.js',
            'js/vendor/formly.min.js',
            'js/vendor/angular-formly-templates-bootstrap.min.js',
            'js/vendor/moment.quacked.js',
            'js/vendor/angular-xmlrpc.js',
            'js/vendor/angular-dialgauge.quacked.js',
            'tests/bootstrap.js',
            'js/CRUD.entities.js',
            'js/CRUD.background.bootstrap.js',
            'js/*.js',
            'js/directives/**.js',
            'js/services/*.js',
            'js/services/TorrentClients/TorrentData.js',
            'js/services/*/*.js',
            'js/controllers/**.js',
            'tests/test-main.js', {
                pattern: 'tests/CalendarEvents.test.js',
                included: true
            }, {
                pattern: 'tests/fixtures/*.json',
                included: false,
                served: true
            }, {
                pattern: '_locales/*.json',
                included: false,
                served: true
            }

        ],

        exclude: [

            'js/background.js',
            'js/CRUD.bootstrap.js',
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

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: process.env.TRAVIS ? ['ChromeTravis'] : ['Chrome'],

        browserDisconnectTimeout: 30000,
        browserNoActivityTimeout: 60000,


        customLaunchers: {
            ChromeTravis: {
                base: 'ChromeCanary',
                flags: ['--no-sandbox'],
            },
        },


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    };

    config.set(configuration);
};