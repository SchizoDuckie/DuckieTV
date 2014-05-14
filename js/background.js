/** 
 * Make sure migrations don't run on the latest versions.
 */
chrome.runtime.onInstalled.addListener(function(details) {
    localStorage.setItem('runtime.event', angular.toJson(details, true));
    if (details.reason == "install") {
        console.log("This is a first install!");
        localStorage.setItem('0.4migration', 'done');
        localStorage.setItem('0.5.firetimers', 'done');
        localStorage.setItem('0.53.createtimers', 'done');
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
    }
});

/**
 * Handle global dependencies
 */

angular.module('DuckieTV', [
    'DuckieTV.providers.eventwatcher',
    'DuckieTV.providers.eventscheduler',
    'DuckieTV.providers.favorites',
    'DuckieTV.providers.trakttv'
])

/**
 * Set up the xml interceptor and whitelist the chrome extension's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})

.run(function($rootScope, EventSchedulerService, FavoritesService) {
    EventSchedulerService.initialize();
    console.log("Background page initialized!");
});

angular.bootstrap(document, ['DuckieTV']);