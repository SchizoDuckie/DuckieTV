exports.config = {

    specs: [
        'tests/**/*.spec.js'
    ],

    capabilities: {
        'browserName': 'chrome',

    },

    suites: {
        favorites: [
            'tests/FavoritesService.spec.js'
        ]
    },

    baseUrl: 'http://localhost/duckietv',
    jasmineNodeOpts: {
        showColors: true
    }
};