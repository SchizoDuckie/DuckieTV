/**
 * The background.js service gets launched by chrome's background process when a timer is about to fire
 * It's basically a minimalist implementation of DuckieTV's favorites update mechanism.
 *
 * The way this works is simple:
 * A timer launches an event channel at a given time
 * It broadcasts a message on a channel something is listening for (for instance favorites:update, which triggers the FavoritesService)
 * After that the page gets torn down again to reduce memory footprint.
 *
 */


/** 
 * Make sure missing timers get restored. Fired when a profile that has this extension installed first starts up.
 */
chrome.runtime.onStartup.addListener(function() {
    setTimeout(function() {
        angular.element(document).injector().get('EventSchedulerService').fixMissingTimers();
    }, 5000);
});


/** 
 * Make sure migrations don't run on the latest versions.
 */
chrome.runtime.onInstalled.addListener(function(details) {
    localStorage.setItem('runtime.event', angular.toJson(details, true));
    if (details.reason == "install") {
        console.log("This is a first install!");
        localStorage.setItem('upgrade.notify', chrome.runtime.getManifest().version);
        /*
         * example: localStorage.setItem('0.54.createtimers', 'done');
         */
    } else if (details.reason == "update") {
        var thisVersion = chrome.runtime.getManifest().version;
        console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
        if (details.previousVersion != thisVersion) {
            localStorage.setItem('upgrade.notify', thisVersion);
        }
    };
});


/**
 * Handle global dependencies
 */
angular.module('DuckieTV', [
    'DuckieTV.directives.torrentdialog',
    'DuckieTV.providers.alarms',
    'DuckieTV.providers.eventwatcher',
    'DuckieTV.providers.eventscheduler',
    'DuckieTV.providers.episodeaired',
    'DuckieTV.providers.favorites',
    'DuckieTV.providers.trakttv',
    'DuckieTV.providers.trakttvv2',
    'DuckieTV.providers.settings',
    'DuckieTV.providers.scenenames',
    'DuckieTV.providers.generictorrentsearch',
])

/**
 * Set up the xml interceptor and whitelist the chrome extension 's filesystem and magnet links
 */
.config(function($httpProvider, $compileProvider) {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|magnet|data):/);
    $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|ftp|file):|data:image|filesystem:chrome-extension:/);
})

/** 
 * The only thing we do is start the event scheduler service, which in turn broadcasts messages to anything listening.
 * FavoritesService is added as a dependency so that it can pick up these events upon initialisation.
 */
.run(function(EventWatcherService, EpisodeAiredService, FavoritesService, SettingsService, $rootScope) {

    $rootScope.getSetting = function(key) {
        return SettingsService.get(key);
    };
    // when the sync has happened, check if there's a foreground page active and notify that of changes that came in.
    $rootScope.$on('storage:hassynced', function(event, progress) {
        console.log('storage has synced! Messaging foreground to process deletions!', progress);
        chrome.runtime.sendMessage({
            channel: 'sync:processremoteupdate',
            eventData: progress
        });
    });
    EventWatcherService.initialize();
    EpisodeAiredService.attach();
});

// Since there is no html document that bootstraps angular using an ang-app tag, we need to call bootstrap manually
angular.bootstrap(document, ['DuckieTV']);