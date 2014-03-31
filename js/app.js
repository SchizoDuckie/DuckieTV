/**
 * Handle global dependencies
 */

angular.module('DuckieTV', [
    'ngRoute',
    'xml',
    'datePicker',
    'ui.bootstrap',
    'DuckieTV.calendar',
    'DuckieTV.providers',
    'DuckieTV.directives',
    'DuckieTV.controllers',
    'DuckieTV.mirrorresolver',
    'DuckieTV.thepiratebay',
    'DuckieTV.kickasstorrents',
    'DuckieTV.torrentfreak',
    'DuckieTV.tvrage',
    'DuckieTV.tvrage.sync',
    'DuckieTV.thetvdb',
    'DuckieTV.trakttv',
    'DuckieTV.scenenames',
    'DuckieTV.filereader',
    'DuckieTV.imdb',
    'DuckieTV.settingssync',
    'colorpicker.module',
    'Chrome.topSites',
    'lazy-background'
])

/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {
    $httpProvider.interceptors.push('xmlHttpInterceptor');
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})


/**
 * Unsafe HTML entities passthrough.
 * (Used for for instance typeAheadIMDB.html)
 */
.filter('unsafe', function($sce) {
    return function(val) {
        return $sce.trustAsHtml(val);
    };
})
/**
 * Routing configuration.
 */
.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'templates/home.html',
            controller: 'MainCtrl'
        })
        .when('/watchlist', {
            templateUrl: 'templates/watchlist.html',
            controller: 'WatchlistCtrl'
        })
        .when('/series/:id', {
            templateUrl: 'templates/serie.html',
            controller: 'SerieCtrl'
        })
        .when('/serie/:id/episode/:episode', {
            templateUrl: 'templates/episode.html',
            controller: 'EpisodeCtrl'
        })
        .when('/settings', {
            templateUrl: 'templates/settings.html',
            controller: 'SettingsCtrl'
        })
        .otherwise({
            redirectTo: '/'
        });
}).run(function($rootScope, SettingsService, StorageSyncService) {

    $rootScope.getSetting = function(key) {
        return SettingsService.get(key);
    }

    $rootScope.setSetting = function(key, value) {
        return SettingsService.set(key, value);
    }

    $rootScope.enableSetting = function(key) {
        SettingsService.set(key, true);
    }

    $rootScope.disableSetting = function(key) {
        SettingsService.set(key, false);
    }

    $rootScope.$on('storage:update', function() {
        if ($rootScope.getSetting('storage.sync') == true) {
            console.log("STorage sync can run!");
            StorageSyncService.readIfSynced();
            StorageSyncService.synchronize();
        }
    });
})